from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import case, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.models.billing_order import BillingOrder
from app.models.site_user import SiteUser
from app.models.wallet_ledger_entry import WalletLedgerEntry
from app.models.wallet_payment_transaction import WalletPaymentTransaction
from app.models.wallet_recharge_order import WalletRechargeOrder
from app.schemas.billing_order import BillingOrderStatus
from app.schemas.payment import OrderPaymentMethod, PaymentLaunchResponse, PaymentTransactionStatus
from app.schemas.wallet import (
    AdminWalletLedgerItemResponse,
    AdminWalletLedgerListResponse,
    AdminWalletRechargeItemResponse,
    AdminWalletRechargeListResponse,
    WalletEntryType,
    WalletLedgerListResponse,
    WalletLedgerRecordResponse,
    WalletLedgerSourceType,
    WalletPaymentMethod,
    WalletPaymentTransactionResponse,
    WalletRechargeLaunchRequest,
    WalletRechargeLaunchResponse,
    WalletRechargeOrderResponse,
    WalletRechargePaymentStatusResponse,
    WalletSummaryResponse,
    WalletTransactionListResponse,
    WalletTransactionResponse,
    WalletTransactionType,
)
from app.services.payment_provider import CreatePaymentRequest, PaymentQueryResult, VerifiedPaymentNotification


UTC = timezone.utc
RECHARGE_NO_ALPHABET = string.ascii_uppercase + string.digits
PAYMENT_NO_ALPHABET = string.ascii_uppercase + string.digits


class WalletValidationError(ValueError):
    pass


class WalletConflictError(ValueError):
    pass


class WalletNotFoundError(ValueError):
    pass


def get_wallet_summary(db: Session, site_user_id: int) -> WalletSummaryResponse:
    credit_expr = case((WalletLedgerEntry.entry_type == WalletEntryType.CREDIT.value, WalletLedgerEntry.amount), else_=Decimal("0.00"))
    debit_expr = case((WalletLedgerEntry.entry_type == WalletEntryType.DEBIT.value, WalletLedgerEntry.amount), else_=Decimal("0.00"))
    total_recharged, total_consumed, last_updated_at = db.query(
        func.coalesce(func.sum(credit_expr), Decimal("0.00")),
        func.coalesce(func.sum(debit_expr), Decimal("0.00")),
        func.max(WalletLedgerEntry.occurred_at),
    ).filter(WalletLedgerEntry.site_user_id == site_user_id).one()
    total_recharged = Decimal(total_recharged).quantize(Decimal("0.01"))
    total_consumed = Decimal(total_consumed).quantize(Decimal("0.01"))
    return WalletSummaryResponse(
        current_balance=(total_recharged - total_consumed).quantize(Decimal("0.01")),
        total_recharged=total_recharged,
        total_consumed=total_consumed,
        last_updated_at=_utc_value(last_updated_at),
    )


def backfill_wallet_ledger(db: Session, dry_run: bool = False) -> dict[str, int]:
    """Backfill cash-wallet credits from paid recharge orders only.

    Prepaid product purchases and supplier consumptions no longer mirror into the cash wallet.
    """
    recharge_inserted = 0
    recharges = db.query(WalletRechargeOrder).filter(WalletRechargeOrder.status == "PAID").all()
    for recharge in recharges:
        if ensure_wallet_credit_from_paid_recharge_order(db, recharge, _utc_value(recharge.paid_at)):
            recharge_inserted += 1
    if dry_run:
        db.rollback()
    else:
        db.commit()
    return {
        "scanned_recharge_orders": len(recharges),
        "inserted_recharge_credits": recharge_inserted,
        "scanned_prepaid_orders": 0,
        "inserted_prepaid_credits": 0,
        "scanned_consumptions": 0,
        "inserted_consumption_debits": 0,
    }


def get_wallet_ledger_records(db: Session, site_user_id: int, page: int, page_size: int) -> WalletLedgerListResponse:
    query = db.query(WalletLedgerEntry).filter(WalletLedgerEntry.site_user_id == site_user_id)
    total = query.count()
    items = (
        query.order_by(WalletLedgerEntry.occurred_at.desc(), WalletLedgerEntry.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return WalletLedgerListResponse(
        items=[_wallet_ledger_entry_to_response(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_wallet_transactions(
    db: Session,
    site_user_id: int,
    page: int,
    page_size: int,
    transaction_type: WalletTransactionType | None = None,
) -> WalletTransactionListResponse:
    """List cash-wallet ledger entries only (recharge credits + order payment debits + legacy rows)."""
    query = db.query(WalletLedgerEntry).filter(WalletLedgerEntry.site_user_id == site_user_id)
    if transaction_type == WalletTransactionType.RECHARGE:
        query = query.filter(WalletLedgerEntry.source_type == WalletLedgerSourceType.RECHARGE_ORDER.value)
    elif transaction_type == WalletTransactionType.ORDER_PAYMENT:
        query = query.filter(WalletLedgerEntry.source_type == WalletLedgerSourceType.ORDER_PAYMENT.value)
    elif transaction_type == WalletTransactionType.PREPAID_CREDIT:
        query = query.filter(WalletLedgerEntry.source_type == WalletLedgerSourceType.PAID_ORDER.value)
    elif transaction_type == WalletTransactionType.CONSUMPTION:
        query = query.filter(WalletLedgerEntry.source_type == WalletLedgerSourceType.CONSUMPTION.value)
    elif transaction_type == WalletTransactionType.DIRECT_PURCHASE:
        # Removed synthetic union of monthly external pays; keep empty for API compatibility
        return WalletTransactionListResponse(items=[], total=0, page=page, page_size=page_size)

    total = query.count()
    ledgers = (
        query.order_by(WalletLedgerEntry.occurred_at.desc(), WalletLedgerEntry.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    recharge_ids = [item.source_id for item in ledgers if item.source_type == WalletLedgerSourceType.RECHARGE_ORDER.value]
    order_ids = [
        item.source_id
        for item in ledgers
        if item.source_type in {WalletLedgerSourceType.ORDER_PAYMENT.value, WalletLedgerSourceType.PAID_ORDER.value}
    ]
    recharges = {
        item.id: item for item in db.query(WalletRechargeOrder).filter(WalletRechargeOrder.id.in_(recharge_ids)).all()
    } if recharge_ids else {}
    orders = {
        item.id: item for item in db.query(BillingOrder).filter(BillingOrder.id.in_(order_ids)).all()
    } if order_ids else {}

    type_map = {
        WalletLedgerSourceType.RECHARGE_ORDER.value: WalletTransactionType.RECHARGE,
        WalletLedgerSourceType.ORDER_PAYMENT.value: WalletTransactionType.ORDER_PAYMENT,
        WalletLedgerSourceType.PAID_ORDER.value: WalletTransactionType.PREPAID_CREDIT,
        WalletLedgerSourceType.CONSUMPTION.value: WalletTransactionType.CONSUMPTION,
    }
    items: list[WalletTransactionResponse] = []
    for ledger in ledgers:
        recharge = recharges.get(ledger.source_id) if ledger.source_type == WalletLedgerSourceType.RECHARGE_ORDER.value else None
        order = orders.get(ledger.source_id) if ledger.source_type in {
            WalletLedgerSourceType.ORDER_PAYMENT.value,
            WalletLedgerSourceType.PAID_ORDER.value,
        } else None
        items.append(
            WalletTransactionResponse(
                id=f"ledger-{ledger.id}",
                transaction_type=type_map[ledger.source_type],
                amount=Decimal(ledger.amount).quantize(Decimal("0.01")),
                title=ledger.title,
                occurred_at=_utc_value(ledger.occurred_at) or datetime.now(UTC),
                reference_no=recharge.recharge_no if recharge else order.order_no if order else None,
                order_id=order.id if order else None,
                order_no=order.order_no if order else None,
                service_code=ledger.service_code,
                service_name=ledger.service_name,
                payment_method=WalletPaymentMethod(recharge.payment_method) if recharge else None,
            )
        )
    return WalletTransactionListResponse(items=items, total=int(total), page=page, page_size=page_size)


def pay_order_with_wallet(db: Session, order_id: int, site_user_id: int) -> PaymentLaunchResponse:
    from app.services.billing_order import expire_stale_pending_orders

    expire_stale_pending_orders(db, site_user_id=site_user_id)
    order = (
        db.query(BillingOrder)
        .filter(BillingOrder.id == order_id, BillingOrder.site_user_id == site_user_id)
        .with_for_update()
        .one_or_none()
    )
    if order is None:
        raise WalletNotFoundError("订单不存在")

    existing_debit = _get_wallet_ledger_by_source(
        db, WalletLedgerSourceType.ORDER_PAYMENT.value, order.id, for_update=True
    )
    if order.status == BillingOrderStatus.PAID.value and existing_debit is not None:
        return PaymentLaunchResponse(
            payment_no=f"WALLET-{order.id}",
            provider="WALLET",
            status=PaymentTransactionStatus.SUCCESS,
            checkout_url="",
            payment_method=OrderPaymentMethod.WALLET,
            order_id=order.id,
            order_status=order.status,
        )
    if order.status == BillingOrderStatus.CANCELED.value:
        raise WalletConflictError("订单已超时取消，请重新下单")
    if order.status not in {BillingOrderStatus.PENDING_PAYMENT.value, BillingOrderStatus.PAYMENT_FAILED.value}:
        raise WalletConflictError("当前订单状态不允许余额支付")

    amount = Decimal(order.order_amount).quantize(Decimal("0.01"))
    balance = get_wallet_summary(db, site_user_id).current_balance
    if balance < amount:
        raise WalletConflictError("钱包余额不足，请先充值")

    now = datetime.now(UTC).replace(tzinfo=None)
    try:
        with db.begin_nested():
            db.add(
                WalletLedgerEntry(
                    site_user_id=site_user_id,
                    entry_type=WalletEntryType.DEBIT.value,
                    amount=amount,
                    currency=order.currency,
                    source_type=WalletLedgerSourceType.ORDER_PAYMENT.value,
                    source_id=order.id,
                    title=f"余额支付：{order.product_name}",
                    service_code=order.service_code,
                    service_name=order.service_name,
                    occurred_at=now,
                )
            )
            db.flush()
    except IntegrityError:
        existing_debit = _get_wallet_ledger_by_source(db, WalletLedgerSourceType.ORDER_PAYMENT.value, order.id)
        if existing_debit is None:
            raise
        order = db.query(BillingOrder).filter(BillingOrder.id == order_id).one()
        return PaymentLaunchResponse(
            payment_no=f"WALLET-{order.id}",
            provider="WALLET",
            status=PaymentTransactionStatus.SUCCESS,
            checkout_url="",
            payment_method=OrderPaymentMethod.WALLET,
            order_id=order.id,
            order_status=order.status,
        )

    order.status = BillingOrderStatus.PAID.value
    order.payment_channel = "WALLET"
    if order.paid_at is None:
        order.paid_at = now
    order.updated_at = now

    from app.services.prepaid_billing import ensure_prepaid_order_credit_entry

    ensure_prepaid_order_credit_entry(db, order, _utc_value(order.paid_at))
    db.commit()
    db.refresh(order)
    return PaymentLaunchResponse(
        payment_no=f"WALLET-{order.id}",
        provider="WALLET",
        status=PaymentTransactionStatus.SUCCESS,
        checkout_url="",
        payment_method=OrderPaymentMethod.WALLET,
        order_id=order.id,
        order_status=order.status,
    )


def launch_wallet_recharge(
    db: Session,
    site_user_id: int,
    payload: WalletRechargeLaunchRequest,
    request_id: str | None,
    api_base_url: str,
) -> WalletRechargeLaunchResponse:
    normalized_request_id = (request_id or "").strip()
    if not normalized_request_id:
        raise WalletValidationError("缺少幂等请求头 Idempotency-Key")

    existing = (
        db.query(WalletRechargeOrder)
        .filter(
            WalletRechargeOrder.site_user_id == site_user_id,
            WalletRechargeOrder.request_id == normalized_request_id,
        )
        .one_or_none()
    )
    if existing is not None:
        if Decimal(existing.amount).quantize(Decimal("0.01")) != payload.amount or existing.payment_method != payload.payment_method.value:
            raise WalletConflictError("同一幂等键对应的充值参数不一致")
        payment = _start_or_reuse_wallet_payment(db, existing, api_base_url)
        return WalletRechargeLaunchResponse(
            recharge=_wallet_recharge_order_to_response(existing),
            payment=_wallet_payment_transaction_to_response(payment),
            checkout_url=payment.checkout_url or "",
        )

    now = datetime.now(UTC).replace(tzinfo=None)
    recharge = WalletRechargeOrder(
        recharge_no=_generate_recharge_no(now.replace(tzinfo=UTC)),
        site_user_id=site_user_id,
        request_id=normalized_request_id,
        amount=payload.amount,
        currency="CNY",
        payment_method=payload.payment_method.value,
        status="PENDING_PAYMENT",
        created_at=now,
        updated_at=now,
    )
    db.add(recharge)
    db.flush()

    payment = _create_wallet_payment(db, recharge, api_base_url, now)
    db.commit()
    db.refresh(recharge)
    db.refresh(payment)
    return WalletRechargeLaunchResponse(
        recharge=_wallet_recharge_order_to_response(recharge),
        payment=_wallet_payment_transaction_to_response(payment),
        checkout_url=payment.checkout_url or "",
    )


def get_wallet_recharge_payment_status(db: Session, recharge_id: int, site_user_id: int) -> WalletRechargePaymentStatusResponse:
    recharge = (
        db.query(WalletRechargeOrder)
        .filter(WalletRechargeOrder.id == recharge_id, WalletRechargeOrder.site_user_id == site_user_id)
        .one_or_none()
    )
    if recharge is None:
        raise WalletNotFoundError("钱包充值订单不存在")
    latest = _get_latest_wallet_payment(db, recharge.id)
    if latest and latest.status == PaymentTransactionStatus.PENDING.value:
        now = datetime.now(UTC).replace(tzinfo=None)
        if latest.last_query_at is None or (now - latest.last_query_at) >= timedelta(seconds=3):
            latest.last_query_at = now
            provider = _get_payment_provider(db, latest.provider)
            result = provider.query_payment(latest.provider_transaction_no or "")
            _apply_wallet_payment_result(db, latest.id, result, allow_query_side_effects=True)
            db.commit()
            recharge = (
                db.query(WalletRechargeOrder)
                .filter(WalletRechargeOrder.id == recharge_id, WalletRechargeOrder.site_user_id == site_user_id)
                .one()
            )
            latest = _get_latest_wallet_payment(db, recharge.id)
        else:
            db.commit()

    return WalletRechargePaymentStatusResponse(
        recharge_id=recharge.id,
        recharge_no=recharge.recharge_no,
        recharge_status=recharge.status,
        payment_method=WalletPaymentMethod(recharge.payment_method),
        amount=Decimal(recharge.amount).quantize(Decimal("0.01")),
        paid_at=_utc_value(recharge.paid_at),
        latest_payment=_wallet_payment_transaction_to_response(latest) if latest else None,
    )


def process_wallet_payment_notification(
    db: Session,
    verified: VerifiedPaymentNotification,
) -> bool:
    payment = (
        db.query(WalletPaymentTransaction)
        .filter(WalletPaymentTransaction.payment_no == verified.payment_no)
        .with_for_update()
        .one_or_none()
    )
    if payment is None and verified.provider_transaction_no:
        payment = (
            db.query(WalletPaymentTransaction)
            .filter(
                WalletPaymentTransaction.provider == verified.provider,
                WalletPaymentTransaction.provider_transaction_no == verified.provider_transaction_no,
            )
            .with_for_update()
            .one_or_none()
        )
    if payment is None:
        return False
    _apply_wallet_payment_result(db, payment.id, verified, allow_query_side_effects=False)
    return True


def ensure_wallet_credit_from_paid_prepaid_order(
    db: Session,
    order: BillingOrder,
    occurred_at: datetime | None = None,
) -> bool:
    """Deprecated: prepaid product purchases must not credit the cash wallet."""
    return False


def ensure_wallet_credit_from_paid_recharge_order(
    db: Session,
    recharge: WalletRechargeOrder,
    occurred_at: datetime | None = None,
) -> bool:
    if recharge.status != "PAID":
        return False
    existing = _get_wallet_ledger_by_source(db, WalletLedgerSourceType.RECHARGE_ORDER.value, recharge.id, for_update=True)
    if existing is not None:
        return False
    try:
        with db.begin_nested():
            db.add(
                WalletLedgerEntry(
                    site_user_id=recharge.site_user_id,
                    entry_type=WalletEntryType.CREDIT.value,
                    amount=Decimal(recharge.amount).quantize(Decimal("0.01")),
                    currency=recharge.currency,
                    source_type=WalletLedgerSourceType.RECHARGE_ORDER.value,
                    source_id=recharge.id,
                    title=f"钱包充值（{_payment_method_label(recharge.payment_method)}）",
                    service_code=None,
                    service_name=None,
                    occurred_at=_naive_utc(occurred_at) or recharge.paid_at or datetime.now(UTC).replace(tzinfo=None),
                )
            )
            db.flush()
        return True
    except IntegrityError:
        return False


def ensure_wallet_debit_from_consumption(
    db: Session,
    record,
) -> bool:
    """Deprecated: supplier consumption must debit prepaid service credit only, not cash wallet."""
    return False


def list_admin_wallet_ledger(
    db: Session,
    page: int,
    page_size: int,
    user_keyword: str | None = None,
    entry_type: str | None = None,
    source_type: str | None = None,
) -> AdminWalletLedgerListResponse:
    query = db.query(WalletLedgerEntry, SiteUser).join(SiteUser, SiteUser.id == WalletLedgerEntry.site_user_id)
    if user_keyword:
        keyword = f"%{user_keyword.strip()}%"
        query = query.filter((SiteUser.name.like(keyword)) | (SiteUser.phone.like(keyword)))
    if entry_type:
        query = query.filter(WalletLedgerEntry.entry_type == entry_type)
    if source_type:
        query = query.filter(WalletLedgerEntry.source_type == source_type)
    total = query.count()
    rows = (
        query.order_by(WalletLedgerEntry.occurred_at.desc(), WalletLedgerEntry.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    order_ids = [
        ledger.source_id
        for ledger, _ in rows
        if ledger.source_type in {WalletLedgerSourceType.ORDER_PAYMENT.value, WalletLedgerSourceType.PAID_ORDER.value}
    ]
    recharge_ids = [
        ledger.source_id for ledger, _ in rows if ledger.source_type == WalletLedgerSourceType.RECHARGE_ORDER.value
    ]
    orders = {
        item.id: item for item in db.query(BillingOrder).filter(BillingOrder.id.in_(order_ids)).all()
    } if order_ids else {}
    recharges = {
        item.id: item for item in db.query(WalletRechargeOrder).filter(WalletRechargeOrder.id.in_(recharge_ids)).all()
    } if recharge_ids else {}

    items: list[AdminWalletLedgerItemResponse] = []
    for ledger, user in rows:
        order = orders.get(ledger.source_id) if ledger.source_type in {
            WalletLedgerSourceType.ORDER_PAYMENT.value,
            WalletLedgerSourceType.PAID_ORDER.value,
        } else None
        recharge = recharges.get(ledger.source_id) if ledger.source_type == WalletLedgerSourceType.RECHARGE_ORDER.value else None
        items.append(
            AdminWalletLedgerItemResponse(
                id=ledger.id,
                site_user_id=ledger.site_user_id,
                user_name=user.name,
                user_phone_masked=_mask_phone(user.mobile_fuzzy or user.phone),
                entry_type=WalletEntryType(ledger.entry_type),
                amount=Decimal(ledger.amount).quantize(Decimal("0.01")),
                source_type=WalletLedgerSourceType(ledger.source_type),
                source_id=ledger.source_id,
                title=ledger.title,
                service_code=ledger.service_code,
                service_name=ledger.service_name,
                reference_no=recharge.recharge_no if recharge else order.order_no if order else None,
                order_id=order.id if order else None,
                occurred_at=_utc_value(ledger.occurred_at) or datetime.now(UTC),
                created_at=_utc_value(ledger.created_at) or datetime.now(UTC),
            )
        )
    return AdminWalletLedgerListResponse(items=items, total=total, page=page, page_size=page_size)


def list_admin_wallet_recharges(
    db: Session,
    page: int,
    page_size: int,
    user_keyword: str | None = None,
    status: str | None = None,
) -> AdminWalletRechargeListResponse:
    query = db.query(WalletRechargeOrder, SiteUser).join(SiteUser, SiteUser.id == WalletRechargeOrder.site_user_id)
    if user_keyword:
        keyword = f"%{user_keyword.strip()}%"
        query = query.filter((SiteUser.name.like(keyword)) | (SiteUser.phone.like(keyword)))
    if status:
        query = query.filter(WalletRechargeOrder.status == status)
    total = query.count()
    rows = (
        query.order_by(WalletRechargeOrder.created_at.desc(), WalletRechargeOrder.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [
        AdminWalletRechargeItemResponse(
            id=recharge.id,
            recharge_no=recharge.recharge_no,
            site_user_id=recharge.site_user_id,
            user_name=user.name,
            user_phone_masked=_mask_phone(user.mobile_fuzzy or user.phone),
            amount=Decimal(recharge.amount).quantize(Decimal("0.01")),
            currency=recharge.currency,
            payment_method=WalletPaymentMethod(recharge.payment_method),
            status=recharge.status,
            paid_at=_utc_value(recharge.paid_at),
            created_at=_utc_value(recharge.created_at) or datetime.now(UTC),
            updated_at=_utc_value(recharge.updated_at) or datetime.now(UTC),
        )
        for recharge, user in rows
    ]
    return AdminWalletRechargeListResponse(items=items, total=total, page=page, page_size=page_size)


def _create_wallet_payment(
    db: Session,
    recharge: WalletRechargeOrder,
    api_base_url: str,
    now: datetime | None = None,
) -> WalletPaymentTransaction:
    current = now or datetime.now(UTC).replace(tzinfo=None)
    payment = WalletPaymentTransaction(
        payment_no=_generate_wallet_payment_no(current.replace(tzinfo=UTC)),
        recharge_order_id=recharge.id,
        recharge_no=recharge.recharge_no,
        provider=settings.payment_provider_normalized,
        amount=Decimal(recharge.amount).quantize(Decimal("0.01")),
        currency=recharge.currency,
        status=PaymentTransactionStatus.CREATED.value,
        created_at=current,
        updated_at=current,
    )
    db.add(payment)
    db.flush()

    provider = _get_payment_provider(db, payment.provider)
    result = provider.create_payment(
        CreatePaymentRequest(
            payment_no=payment.payment_no,
            order_no=recharge.recharge_no,
            amount=Decimal(recharge.amount).quantize(Decimal("0.01")),
            currency=recharge.currency,
            subject=f"钱包充值 {recharge.amount}",
            notify_url=f"{api_base_url.rstrip('/')}/api/payment/notifications/{payment.provider.lower()}",
            return_url=f"{settings.normalized_site_public_url}/wallet/payment-result?recharge_id={recharge.id}",
            api_base_url=api_base_url.rstrip("/"),
        )
    )
    payment.provider_transaction_no = result.provider_transaction_no
    payment.checkout_url = result.checkout_url
    payment.status = result.status.value
    payment.updated_at = current
    return payment


def _start_or_reuse_wallet_payment(db: Session, recharge: WalletRechargeOrder, api_base_url: str) -> WalletPaymentTransaction:
    if recharge.status not in {"PENDING_PAYMENT", "PAYMENT_FAILED"}:
        raise WalletConflictError("当前充值单状态不允许继续支付")
    pending = (
        db.query(WalletPaymentTransaction)
        .filter(
            WalletPaymentTransaction.recharge_order_id == recharge.id,
            WalletPaymentTransaction.status.in_([PaymentTransactionStatus.CREATED.value, PaymentTransactionStatus.PENDING.value]),
        )
        .order_by(WalletPaymentTransaction.id.desc())
        .first()
    )
    if pending and pending.checkout_url:
        return pending

    now = datetime.now(UTC).replace(tzinfo=None)
    payment = _create_wallet_payment(db, recharge, api_base_url, now)
    if recharge.status == "PAYMENT_FAILED":
        recharge.status = "PENDING_PAYMENT"
        recharge.updated_at = now
    db.commit()
    db.refresh(recharge)
    db.refresh(payment)
    return payment


def _apply_wallet_payment_result(
    db: Session,
    payment_transaction_id: int,
    result: PaymentQueryResult | VerifiedPaymentNotification,
    allow_query_side_effects: bool,
) -> None:
    payment = db.query(WalletPaymentTransaction).filter(WalletPaymentTransaction.id == payment_transaction_id).with_for_update().one_or_none()
    if payment is None:
        raise WalletValidationError("钱包支付记录不存在")
    recharge = db.query(WalletRechargeOrder).filter(WalletRechargeOrder.id == payment.recharge_order_id).with_for_update().one_or_none()
    if recharge is None:
        raise WalletValidationError("钱包充值订单不存在")

    _validate_wallet_payment_result(payment, result)
    now = datetime.now(UTC).replace(tzinfo=None)
    payment.provider_transaction_no = result.provider_transaction_no
    payment.status = result.status.value
    payment.provider_completed_at = _naive_utc(result.completed_at)
    payment.failure_code = result.failure_code
    payment.failure_message = result.failure_message
    payment.updated_at = now

    if result.status == PaymentTransactionStatus.SUCCESS:
        recharge.status = "PAID"
        if recharge.paid_at is None:
            recharge.paid_at = _naive_utc(result.completed_at) or now
        recharge.updated_at = now
        ensure_wallet_credit_from_paid_recharge_order(db, recharge, _utc_value(recharge.paid_at))
        return

    if result.status == PaymentTransactionStatus.FAILED:
        if recharge.status != "PAID":
            recharge.status = "PAYMENT_FAILED"
            recharge.updated_at = now
        return

    if result.status == PaymentTransactionStatus.CLOSED:
        if recharge.status == "CANCELED":
            recharge.updated_at = now
            return
        if allow_query_side_effects and recharge.status != "PAID":
            recharge.status = "PAYMENT_FAILED"
            recharge.updated_at = now


def _validate_wallet_payment_result(
    payment: WalletPaymentTransaction,
    result: PaymentQueryResult | VerifiedPaymentNotification,
) -> None:
    if payment.provider != result.provider:
        raise WalletValidationError("支付提供方不匹配")
    if payment.payment_no != result.payment_no:
        raise WalletValidationError("商户支付号不匹配")
    if payment.recharge_no != result.order_no:
        raise WalletValidationError("充值单号不匹配")
    if Decimal(payment.amount).quantize(Decimal("0.01")) != Decimal(result.amount).quantize(Decimal("0.01")):
        raise WalletValidationError("支付金额不匹配")
    if payment.currency != result.currency:
        raise WalletValidationError("支付币种不匹配")


def _get_payment_provider(db: Session, provider_code: str):
    from app.services.billing_payment import get_payment_provider

    return get_payment_provider(db, provider_code)


def _get_latest_wallet_payment(db: Session, recharge_order_id: int) -> WalletPaymentTransaction | None:
    return (
        db.query(WalletPaymentTransaction)
        .filter(WalletPaymentTransaction.recharge_order_id == recharge_order_id)
        .order_by(WalletPaymentTransaction.id.desc())
        .first()
    )


def _get_wallet_ledger_by_source(
    db: Session,
    source_type: str,
    source_id: int,
    for_update: bool = False,
) -> WalletLedgerEntry | None:
    query = db.query(WalletLedgerEntry).filter(
        WalletLedgerEntry.source_type == source_type,
        WalletLedgerEntry.source_id == source_id,
    )
    if for_update:
        query = query.with_for_update()
    return query.one_or_none()


def _wallet_recharge_order_to_response(item: WalletRechargeOrder) -> WalletRechargeOrderResponse:
    return WalletRechargeOrderResponse(
        id=item.id,
        recharge_no=item.recharge_no,
        amount=Decimal(item.amount).quantize(Decimal("0.01")),
        currency=item.currency,
        payment_method=WalletPaymentMethod(item.payment_method),
        status=item.status,
        paid_at=_utc_value(item.paid_at),
        created_at=_utc_value(item.created_at) or datetime.now(UTC),
        updated_at=_utc_value(item.updated_at) or datetime.now(UTC),
    )


def _wallet_payment_transaction_to_response(item: WalletPaymentTransaction) -> WalletPaymentTransactionResponse:
    return WalletPaymentTransactionResponse(
        id=item.id,
        payment_no=item.payment_no,
        provider=item.provider,
        provider_transaction_no=item.provider_transaction_no,
        amount=Decimal(item.amount).quantize(Decimal("0.01")),
        currency=item.currency,
        status=item.status,
        checkout_url=item.checkout_url,
        provider_completed_at=_utc_value(item.provider_completed_at),
        failure_code=item.failure_code,
        failure_message=item.failure_message,
        created_at=_utc_value(item.created_at) or datetime.now(UTC),
        updated_at=_utc_value(item.updated_at) or datetime.now(UTC),
    )


def _wallet_ledger_entry_to_response(item: WalletLedgerEntry) -> WalletLedgerRecordResponse:
    return WalletLedgerRecordResponse(
        id=item.id,
        entry_type=item.entry_type,
        amount=Decimal(item.amount).quantize(Decimal("0.01")),
        source_type=item.source_type,
        source_id=item.source_id,
        title=item.title,
        service_code=item.service_code,
        service_name=item.service_name,
        occurred_at=_utc_value(item.occurred_at) or datetime.now(UTC),
        created_at=_utc_value(item.created_at) or datetime.now(UTC),
    )


def _generate_recharge_no(now: datetime) -> str:
    suffix = "".join(secrets.choice(RECHARGE_NO_ALPHABET) for _ in range(8))
    return f"RCH{now.astimezone(UTC).strftime('%Y%m%d%H%M%S')}{suffix}"


def _generate_wallet_payment_no(now: datetime) -> str:
    suffix = "".join(secrets.choice(PAYMENT_NO_ALPHABET) for _ in range(8))
    return f"WALPAY{now.astimezone(UTC).strftime('%Y%m%d%H%M%S')}{suffix}"


def _payment_method_label(value: str) -> str:
    return "支付宝" if value == WalletPaymentMethod.ALIPAY.value else "微信支付"


def _mask_phone(phone: str) -> str:
    if not phone:
        return "****"
    if len(phone) >= 7:
        return f"{phone[:3]}****{phone[-4:]}"
    return "****"


def _utc_value(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _naive_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)
