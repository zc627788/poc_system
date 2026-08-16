import calendar
import secrets
import string
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.billing_order import BillingOrder
from app.repositories.billing_order import (
    get_admin_order,
    get_order_by_user_request,
    get_user_order,
    list_admin_orders,
    list_user_orders,
)
from app.repositories.billing_product import get_billing_product_by_id
from app.schemas.billing_order import (
    BillingOrderAdminListResponse,
    BillingOrderAdminResponse,
    BillingOrderCreateRequest,
    BillingOrderListResponse,
    BillingOrderResponse,
    BillingOrderStatus,
)
from app.services.billing_payment import (
    PaymentConflictError,
    attach_payment_transactions_to_admin_response,
    attach_payment_transactions_to_order_response,
    close_order_payment_before_cancel,
)


SHANGHAI_TZ = timezone(timedelta(hours=8), name="Asia/Shanghai")
ORDER_RANDOM_ALPHABET = string.ascii_uppercase + string.digits
ORDER_PENDING_TIMEOUT = timedelta(minutes=30)


class BillingOrderNotFoundError(ValueError):
    pass


class BillingOrderConflictError(ValueError):
    pass


class BillingOrderValidationError(ValueError):
    pass


def order_expires_at(created_at: datetime | None) -> datetime | None:
    if created_at is None:
        return None
    created = created_at.replace(tzinfo=timezone.utc) if created_at.tzinfo is None else created_at.astimezone(timezone.utc)
    return created + ORDER_PENDING_TIMEOUT


def expire_stale_pending_orders(db: Session, site_user_id: int | None = None, limit: int = 200) -> int:
    """Auto-cancel PENDING_PAYMENT orders older than 30 minutes. Lazy, no scheduler required."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    deadline = now - ORDER_PENDING_TIMEOUT
    query = db.query(BillingOrder).filter(
        BillingOrder.status == BillingOrderStatus.PENDING_PAYMENT.value,
        BillingOrder.created_at <= deadline,
    )
    if site_user_id is not None:
        query = query.filter(BillingOrder.site_user_id == site_user_id)
    candidates = query.order_by(BillingOrder.id.asc()).limit(limit).all()
    expired_count = 0
    for candidate in candidates:
        if _auto_cancel_expired_order(db, candidate.id, now):
            expired_count += 1
    if expired_count:
        db.commit()
    return expired_count


def _auto_cancel_expired_order(db: Session, order_id: int, now: datetime) -> bool:
    item = db.query(BillingOrder).filter(BillingOrder.id == order_id).with_for_update().one_or_none()
    if item is None or item.status != BillingOrderStatus.PENDING_PAYMENT.value:
        return False
    created = item.created_at.replace(tzinfo=None) if item.created_at and item.created_at.tzinfo else item.created_at
    if created is None or created > now - ORDER_PENDING_TIMEOUT:
        return False
    try:
        close_order_payment_before_cancel(db, item)
    except PaymentConflictError:
        return False
    item = db.query(BillingOrder).filter(BillingOrder.id == order_id).with_for_update().one_or_none()
    if item is None or item.status == BillingOrderStatus.PAID.value:
        return False
    if item.status != BillingOrderStatus.PENDING_PAYMENT.value:
        return False
    item.status = BillingOrderStatus.CANCELED.value
    item.canceled_at = now
    item.updated_at = now
    db.flush()
    return True


def normalize_idempotency_key(value: str | None) -> str:
    normalized = (value or "").strip()
    if not normalized:
        raise BillingOrderValidationError("Idempotency-Key 不能为空")
    if len(normalized) > 64:
        raise BillingOrderValidationError("Idempotency-Key 长度不能超过 64")
    return normalized


def calculate_service_period(start_date: date, month_count: int) -> tuple[date, date]:
    if month_count < 1 or month_count > 36:
        raise BillingOrderValidationError("购买月数必须为 1 至 36")
    month_index = start_date.year * 12 + start_date.month - 1 + month_count
    target_year, zero_based_month = divmod(month_index, 12)
    target_month = zero_based_month + 1
    target_last_day = calendar.monthrange(target_year, target_month)[1]
    if start_date.day > target_last_day:
        return start_date, date(target_year, target_month, target_last_day)
    anniversary = date(target_year, target_month, start_date.day)
    return start_date, anniversary - timedelta(days=1)


def generate_order_no(now: datetime | None = None) -> str:
    china_now = (now or datetime.now(timezone.utc)).astimezone(SHANGHAI_TZ)
    suffix = "".join(secrets.choice(ORDER_RANDOM_ALPHABET) for _ in range(8))
    return f"OPC{china_now.strftime('%Y%m%d%H%M%S')}{suffix}"


def _response(item: BillingOrder) -> BillingOrderResponse:
    def utc_value(value: datetime | None) -> datetime | None:
        return value.replace(tzinfo=timezone.utc) if value and value.tzinfo is None else value

    return BillingOrderResponse(
        id=item.id,
        order_no=item.order_no,
        product_id=item.product_id,
        product_code=item.product_code,
        product_name=item.product_name,
        service_code=item.service_code,
        service_name=item.service_name,
        supplier_name=item.supplier_name,
        billing_mode=item.billing_mode,
        unit_price=item.unit_price,
        month_count=item.month_count,
        order_amount=item.order_amount,
        currency=item.currency,
        service_start_date=item.service_start_date,
        service_end_date=item.service_end_date,
        status=item.status,
        payment_channel=item.payment_channel,
        paid_at=utc_value(item.paid_at),
        canceled_at=utc_value(item.canceled_at),
        expires_at=(
            order_expires_at(item.created_at)
            if item.status == BillingOrderStatus.PENDING_PAYMENT.value
            else None
        ),
        payment_transactions=[],
        created_at=utc_value(item.created_at),
        updated_at=utc_value(item.updated_at),
    )


def _mask_phone(phone: str) -> str:
    if len(phone) >= 7:
        return f"{phone[:3]}****{phone[-4:]}"
    return "****"


def _admin_response(item: BillingOrder, user) -> BillingOrderAdminResponse:
    return BillingOrderAdminResponse(
        **_response(item).model_dump(),
        site_user_id=item.site_user_id,
        user_name=user.name,
        user_phone_masked=user.mobile_fuzzy or _mask_phone(user.phone),
    )


def _ensure_same_idempotent_request(item: BillingOrder, payload: BillingOrderCreateRequest) -> None:
    if item.product_id != payload.product_id or item.month_count != payload.month_count:
        raise BillingOrderConflictError("同一 Idempotency-Key 已用于不同的下单参数")


def create_order(
    db: Session,
    site_user_id: int,
    payload: BillingOrderCreateRequest,
    idempotency_key: str | None,
    now: datetime | None = None,
) -> BillingOrderResponse:
    request_id = normalize_idempotency_key(idempotency_key)
    existing = get_order_by_user_request(db, site_user_id, request_id)
    if existing is not None:
        _ensure_same_idempotent_request(existing, payload)
        return _response(existing)

    product = get_billing_product_by_id(db, payload.product_id)
    if product is None:
        raise BillingOrderNotFoundError("商品不存在")
    if product.status != "ON_SALE":
        raise BillingOrderConflictError("商品已下架")

    created_at = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).replace(tzinfo=None)
    if product.billing_mode == "MONTHLY":
        if payload.month_count is None:
            raise BillingOrderValidationError("按月商品必须选择购买月数")
        start_date = created_at.replace(tzinfo=timezone.utc).astimezone(SHANGHAI_TZ).date()
        service_start_date, service_end_date = calculate_service_period(start_date, payload.month_count)
        month_count = payload.month_count
        order_amount = (Decimal(product.price) * month_count).quantize(Decimal("0.01"))
    else:
        if payload.month_count is not None:
            raise BillingOrderValidationError("预充值商品不能传入购买月数")
        month_count = None
        service_start_date = None
        service_end_date = None
        order_amount = Decimal(product.price).quantize(Decimal("0.01"))

    for _ in range(3):
        item = BillingOrder(
            order_no=generate_order_no(created_at.replace(tzinfo=timezone.utc)),
            site_user_id=site_user_id,
            request_id=request_id,
            product_id=product.id,
            product_code=product.product_code,
            product_name=product.name,
            service_code=product.service_code,
            service_name=product.service_name,
            supplier_name=product.supplier_name,
            billing_mode=product.billing_mode,
            unit_price=product.price,
            month_count=month_count,
            order_amount=order_amount,
            currency="CNY",
            service_start_date=service_start_date,
            service_end_date=service_end_date,
            status=BillingOrderStatus.PENDING_PAYMENT.value,
            created_at=created_at,
            updated_at=created_at,
        )
        db.add(item)
        try:
            db.commit()
            db.refresh(item)
            return _response(item)
        except IntegrityError:
            db.rollback()
            existing = get_order_by_user_request(db, site_user_id, request_id)
            if existing is not None:
                _ensure_same_idempotent_request(existing, payload)
                return _response(existing)
    raise BillingOrderConflictError("订单号生成冲突，请重试")


def get_orders(
    db: Session,
    site_user_id: int,
    page: int,
    page_size: int,
    order_status: BillingOrderStatus | None = None,
) -> BillingOrderListResponse:
    expire_stale_pending_orders(db, site_user_id=site_user_id)
    items, total = list_user_orders(db, site_user_id, page, page_size, order_status.value if order_status else None)
    return BillingOrderListResponse(items=[_response(item) for item in items], total=total, page=page, page_size=page_size)


def get_order(db: Session, order_id: int, site_user_id: int) -> BillingOrderResponse:
    expire_stale_pending_orders(db, site_user_id=site_user_id)
    item = get_user_order(db, order_id, site_user_id)
    if item is None:
        raise BillingOrderNotFoundError("订单不存在")
    return attach_payment_transactions_to_order_response(db, _response(item))


def cancel_order(db: Session, order_id: int, site_user_id: int) -> BillingOrderResponse:
    try:
        expire_stale_pending_orders(db, site_user_id=site_user_id)
        item = get_user_order(db, order_id, site_user_id)
        if item is None:
            raise BillingOrderNotFoundError("订单不存在")
        if item.status == BillingOrderStatus.CANCELED.value:
            db.commit()
            return attach_payment_transactions_to_order_response(db, _response(item))
        if item.status not in {BillingOrderStatus.PENDING_PAYMENT.value, BillingOrderStatus.PAYMENT_FAILED.value}:
            raise BillingOrderConflictError("当前订单状态不允许取消")
        close_order_payment_before_cancel(db, item)
        item = get_user_order(db, order_id, site_user_id, for_update=True)
        if item is None:
            raise BillingOrderNotFoundError("订单不存在")
        if item.status == BillingOrderStatus.PAID.value:
            raise BillingOrderConflictError("当前订单状态不允许取消")
        changed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        item.status = BillingOrderStatus.CANCELED.value
        item.canceled_at = changed_at
        item.updated_at = changed_at
        db.commit()
        db.refresh(item)
        return attach_payment_transactions_to_order_response(db, _response(item))
    except (BillingOrderNotFoundError, BillingOrderConflictError, PaymentConflictError) as exc:
        db.rollback()
        if isinstance(exc, PaymentConflictError):
            raise BillingOrderConflictError(str(exc)) from exc
        raise


def get_admin_orders(
    db: Session,
    page: int,
    page_size: int,
    order_no: str | None = None,
    user_keyword: str | None = None,
    product_id: int | None = None,
    order_status: BillingOrderStatus | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> BillingOrderAdminListResponse:
    def utc_naive(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    expire_stale_pending_orders(db)
    items, total = list_admin_orders(
        db, page, page_size, order_no, user_keyword, product_id,
        order_status.value if order_status else None, utc_naive(start_at), utc_naive(end_at),
    )
    return BillingOrderAdminListResponse(
        items=[_admin_response(item, user) for item, user in items], total=total, page=page, page_size=page_size
    )


def get_admin_order_detail(db: Session, order_id: int) -> BillingOrderAdminResponse:
    expire_stale_pending_orders(db)
    result = get_admin_order(db, order_id)
    if result is None:
        raise BillingOrderNotFoundError("订单不存在")
    item, user = result
    return attach_payment_transactions_to_admin_response(db, _admin_response(item, user))
