from __future__ import annotations

import hashlib
import json
import secrets
import string
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Mapping

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.billing_order import BillingOrder
from app.models.payment_notification import PaymentNotification
from app.models.payment_reconciliation import PaymentReconciliationBatch, PaymentReconciliationItem
from app.models.payment_transaction import PaymentTransaction
from app.repositories.billing_order import get_admin_order, get_user_order
from app.repositories.payment import (
    delete_reconciliation_items,
    get_latest_order_payment_transaction,
    get_order_for_payment_processing,
    get_payment_notification_by_key,
    get_payment_transaction_by_id,
    get_payment_transaction_by_payment_no,
    get_payment_transaction_by_provider_tx,
    get_pending_order_payment_transaction,
    get_reconciliation_batch,
    get_reconciliation_batch_by_provider_date,
    list_order_payment_transactions,
    list_reconciliation_batches,
    list_reconciliation_items,
    list_system_statement_transactions,
    order_has_successful_payment,
)
from app.schemas.billing_order import BillingOrderAdminResponse, BillingOrderResponse, BillingOrderStatus
from app.schemas.payment import (
    BillingOrderPaymentStatusResponse,
    OrderPaymentMethod,
    PaymentLaunchResponse,
    PaymentNotificationProcessStatus,
    PaymentProviderCode,
    PaymentReconciliationBatchDetailResponse,
    PaymentReconciliationBatchListResponse,
    PaymentReconciliationBatchSummaryResponse,
    PaymentReconciliationCreateRequest,
    PaymentReconciliationItemResponse,
    PaymentReconciliationResult,
    PaymentReconciliationRunStatus,
    PaymentTransactionStatus,
    PaymentTransactionSummaryResponse,
)
from app.services.mock_payment_provider import MockPaymentProvider, MockPaymentProviderError
from app.services.payment_provider import (
    ClosePaymentResult,
    CreatePaymentRequest,
    PaymentProvider,
    PaymentQueryResult,
    StatementEntry,
    VerifiedPaymentNotification,
)
from app.services.prepaid_billing import ensure_prepaid_order_credit_entry
from app.services.wallet import pay_order_with_wallet, process_wallet_payment_notification


UTC = timezone.utc
PAYMENT_NO_ALPHABET = string.ascii_uppercase + string.digits


class PaymentConflictError(ValueError):
    pass


class PaymentNotFoundError(ValueError):
    pass


class PaymentValidationError(ValueError):
    pass


class PaymentNotificationUnauthorizedError(ValueError):
    pass


def validate_payment_settings() -> None:
    provider = settings.payment_provider_normalized
    if settings.is_production_environment and (provider == "MOCK" or settings.mock_payment_enabled):
        raise RuntimeError("生产环境禁止启用 Mock 支付平台")
    if provider == "MOCK" and not settings.mock_payment_enabled and not settings.is_test_environment:
        raise RuntimeError("PAYMENT_PROVIDER=mock 时必须显式开启 MOCK_PAYMENT_ENABLED")
    if provider == "MOCK" and not settings.mock_payment_signing_secret.strip():
        raise RuntimeError("Mock 支付签名密钥不能为空")


def should_register_mock_payment_routes() -> bool:
    return settings.payment_provider_normalized == "MOCK" and settings.mock_payment_enabled


def get_payment_provider(db: Session, provider_code: str | None = None) -> PaymentProvider:
    code = (provider_code or settings.payment_provider_normalized).upper()
    if code == "MOCK":
        return MockPaymentProvider(db)
    raise PaymentValidationError("支付提供方未配置")


def payment_transaction_to_response(item: PaymentTransaction) -> PaymentTransactionSummaryResponse:
    return PaymentTransactionSummaryResponse(
        id=item.id,
        payment_no=item.payment_no,
        provider=item.provider,
        provider_transaction_no=item.provider_transaction_no,
        amount=item.amount,
        currency=item.currency,
        status=item.status,
        checkout_url=item.checkout_url,
        provider_completed_at=_utc_value(item.provider_completed_at),
        failure_code=item.failure_code,
        failure_message=item.failure_message,
        created_at=_utc_value(item.created_at),
        updated_at=_utc_value(item.updated_at),
    )


def get_order_payment_transactions(db: Session, order_id: int) -> list[PaymentTransactionSummaryResponse]:
    return [payment_transaction_to_response(item) for item in list_order_payment_transactions(db, order_id)]


def start_order_payment(
    db: Session,
    order_id: int,
    site_user_id: int,
    api_base_url: str,
    payment_method: OrderPaymentMethod = OrderPaymentMethod.EXTERNAL,
) -> PaymentLaunchResponse:
    from app.services.billing_order import expire_stale_pending_orders

    expire_stale_pending_orders(db, site_user_id=site_user_id)

    if payment_method == OrderPaymentMethod.WALLET:
        try:
            return pay_order_with_wallet(db, order_id, site_user_id)
        except Exception as exc:
            # Map wallet domain errors to payment errors where appropriate
            from app.services.wallet import WalletConflictError, WalletNotFoundError, WalletValidationError

            if isinstance(exc, WalletNotFoundError):
                raise PaymentNotFoundError(str(exc)) from exc
            if isinstance(exc, WalletConflictError):
                raise PaymentConflictError(str(exc)) from exc
            if isinstance(exc, WalletValidationError):
                raise PaymentValidationError(str(exc)) from exc
            raise

    order = get_user_order(db, order_id, site_user_id)
    if order is None:
        raise PaymentNotFoundError("订单不存在")
    if order.status == BillingOrderStatus.CANCELED.value:
        raise PaymentConflictError("订单已超时取消，请重新下单")
    if order.status not in {BillingOrderStatus.PENDING_PAYMENT.value, BillingOrderStatus.PAYMENT_FAILED.value}:
        raise PaymentConflictError("当前订单状态不允许发起支付")

    pending = get_pending_order_payment_transaction(db, order.id)
    if pending and pending.checkout_url:
        return PaymentLaunchResponse(
            payment_no=pending.payment_no,
            provider=pending.provider,
            status=pending.status,
            checkout_url=pending.checkout_url,
            payment_method=OrderPaymentMethod.EXTERNAL,
            order_id=order.id,
            order_status=order.status,
        )

    now = datetime.now(UTC).replace(tzinfo=None)
    payment = PaymentTransaction(
        payment_no=generate_payment_no(now.replace(tzinfo=UTC)),
        order_id=order.id,
        order_no=order.order_no,
        provider=settings.payment_provider_normalized,
        amount=order.order_amount,
        currency=order.currency,
        status=PaymentTransactionStatus.CREATED.value,
        created_at=now,
        updated_at=now,
    )
    db.add(payment)
    db.flush()

    provider = get_payment_provider(db, payment.provider)
    result = provider.create_payment(
        CreatePaymentRequest(
            payment_no=payment.payment_no,
            order_no=order.order_no,
            amount=Decimal(order.order_amount).quantize(Decimal("0.01")),
            currency=order.currency,
            subject=order.product_name[:128],
            notify_url=f"{api_base_url.rstrip('/')}/api/payment/notifications/{payment.provider.lower()}",
            return_url=(
                f"{settings.normalized_site_public_url}/orders/payment-result"
                f"?order_id={order.id}"
            ),
            api_base_url=api_base_url.rstrip("/"),
        )
    )
    payment.provider_transaction_no = result.provider_transaction_no
    payment.checkout_url = result.checkout_url
    payment.status = result.status.value
    payment.updated_at = now
    if order.status == BillingOrderStatus.PAYMENT_FAILED.value:
        order.status = BillingOrderStatus.PENDING_PAYMENT.value
        order.updated_at = now
    db.commit()
    db.refresh(payment)
    return PaymentLaunchResponse(
        payment_no=payment.payment_no,
        provider=payment.provider,
        status=payment.status,
        checkout_url=payment.checkout_url or "",
        payment_method=OrderPaymentMethod.EXTERNAL,
        order_id=order.id,
        order_status=order.status,
    )


def get_order_payment_status(db: Session, order_id: int, site_user_id: int) -> BillingOrderPaymentStatusResponse:
    order = get_user_order(db, order_id, site_user_id)
    if order is None:
        raise PaymentNotFoundError("订单不存在")
    latest = get_latest_order_payment_transaction(db, order.id)
    if latest and latest.status == PaymentTransactionStatus.PENDING.value:
        now = datetime.now(UTC).replace(tzinfo=None)
        if latest.last_query_at is None or (now - latest.last_query_at) >= timedelta(seconds=3):
            latest.last_query_at = now
            provider = get_payment_provider(db, latest.provider)
            query_result = provider.query_payment(latest.provider_transaction_no or "")
            _apply_payment_result(db, latest.id, query_result, allow_query_side_effects=True)
            db.commit()
            order = get_user_order(db, order_id, site_user_id)
            latest = get_latest_order_payment_transaction(db, order_id)
        else:
            db.commit()
    return BillingOrderPaymentStatusResponse(
        order_id=order.id,
        order_no=order.order_no,
        order_status=order.status,
        payment_channel=order.payment_channel,
        paid_at=_utc_value(order.paid_at),
        latest_payment=payment_transaction_to_response(latest) if latest else None,
    )


def close_order_payment_before_cancel(db: Session, order: BillingOrder) -> None:
    pending = get_pending_order_payment_transaction(db, order.id)
    if pending is None:
        return
    if not pending.provider_transaction_no:
        return
    provider = get_payment_provider(db, pending.provider)
    close_result = provider.close_payment(pending.provider_transaction_no)
    db.flush()
    locked_payment = get_payment_transaction_by_id(db, pending.id, for_update=True)
    if locked_payment is None:
        return
    _apply_close_result(db, locked_payment.id, close_result)
    db.flush()
    locked_order = get_order_for_payment_processing(db, order.id, for_update=True)
    if locked_order is None:
        return
    if locked_order.status == BillingOrderStatus.PAID.value:
        db.commit()
        raise PaymentConflictError("当前订单已支付，不能取消")


def process_payment_notification_in_session(
    db: Session,
    provider_name: str,
    headers: Mapping[str, str],
    body: bytes,
) -> None:
    provider_code = provider_name.strip().upper()
    notification_key = _raw_notification_key(headers, body)
    existing = get_payment_notification_by_key(db, provider_code, notification_key, for_update=True)
    if existing and existing.signature_valid and existing.process_status == PaymentNotificationProcessStatus.PROCESSED.value:
        return

    now = datetime.now(UTC).replace(tzinfo=None)
    notification_row = existing
    if notification_row is None:
        notification_row = PaymentNotification(
            provider=provider_code,
            notification_id=notification_key,
            headers_json=json.dumps(_sanitize_headers(headers), ensure_ascii=False),
            body_text=_safe_body_text(body),
            signature_valid=False,
            process_status=PaymentNotificationProcessStatus.RECEIVED.value,
            received_at=now,
        )
        db.add(notification_row)
        db.flush()

    provider = get_payment_provider(db, provider_code)
    try:
        verified = provider.verify_notification(headers, body)
    except Exception as exc:
        notification_row.signature_valid = False
        notification_row.process_status = PaymentNotificationProcessStatus.REJECTED.value
        notification_row.error_message = str(exc)
        notification_row.processed_at = now
        db.flush()
        raise PaymentNotificationUnauthorizedError(str(exc)) from exc

    if existing and existing.signature_valid and existing.process_status == PaymentNotificationProcessStatus.PROCESSED.value:
        return

    notification_row.notification_id = verified.notification_id
    notification_row.signature_valid = True
    payment = get_payment_transaction_by_payment_no(db, verified.payment_no, for_update=True)
    if payment is None and verified.provider_transaction_no:
        payment = get_payment_transaction_by_provider_tx(db, provider_code, verified.provider_transaction_no, for_update=True)
    if payment is not None:
        notification_row.payment_transaction_id = payment.id
        try:
            _validate_verified_notification(payment, verified)
        except ValueError as exc:
            notification_row.process_status = PaymentNotificationProcessStatus.REJECTED.value
            notification_row.error_message = str(exc)
            notification_row.processed_at = now
            db.flush()
            raise PaymentValidationError(str(exc)) from exc
        _apply_payment_result(db, payment.id, verified, allow_query_side_effects=False)
    else:
        try:
            handled = process_wallet_payment_notification(db, verified)
        except ValueError as exc:
            notification_row.process_status = PaymentNotificationProcessStatus.REJECTED.value
            notification_row.error_message = str(exc)
            notification_row.processed_at = now
            db.flush()
            raise PaymentValidationError(str(exc)) from exc
        if not handled:
            notification_row.process_status = PaymentNotificationProcessStatus.REJECTED.value
            notification_row.error_message = "本地支付记录不存在"
            notification_row.processed_at = now
            db.flush()
            raise PaymentValidationError("本地支付记录不存在")
    notification_row.process_status = PaymentNotificationProcessStatus.PROCESSED.value
    notification_row.error_message = None
    notification_row.processed_at = now
    db.flush()


def process_payment_notification(
    db: Session,
    provider_name: str,
    headers: Mapping[str, str],
    body: bytes,
) -> None:
    process_payment_notification_in_session(db, provider_name, headers, body)
    db.commit()


def run_reconciliation(
    db: Session,
    admin_user_id: int,
    payload: PaymentReconciliationCreateRequest,
) -> PaymentReconciliationBatchSummaryResponse:
    provider = get_payment_provider(db, payload.provider.value)
    statement_entries = provider.download_statement(payload.statement_date)
    system_entries = list_system_statement_transactions(db, payload.provider.value, payload.statement_date)

    batch = get_reconciliation_batch_by_provider_date(db, payload.provider.value, payload.statement_date, for_update=True)
    now = datetime.now(UTC).replace(tzinfo=None)
    if batch is None:
        batch = PaymentReconciliationBatch(
            provider=payload.provider.value,
            statement_date=payload.statement_date,
            executed_by_admin_user_id=admin_user_id,
            executed_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(batch)
        db.flush()
    else:
        delete_reconciliation_items(db, batch.id)
        batch.executed_by_admin_user_id = admin_user_id
        batch.executed_at = now
        batch.updated_at = now

    items = _build_reconciliation_items(statement_entries, system_entries, batch.id)
    for item in items:
        db.add(item)
    _populate_batch_summary(batch, statement_entries, system_entries, items)
    db.commit()
    db.refresh(batch)
    return reconciliation_batch_to_response(batch)


def get_reconciliations(
    db: Session,
    page: int,
    page_size: int,
    provider: PaymentProviderCode | None = None,
    statement_date: date | None = None,
) -> PaymentReconciliationBatchListResponse:
    items, total = list_reconciliation_batches(
        db, page, page_size, provider.value if provider else None, statement_date
    )
    return PaymentReconciliationBatchListResponse(
        items=[reconciliation_batch_to_response(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_reconciliation_detail(
    db: Session,
    batch_id: int,
    page: int,
    page_size: int,
    result: PaymentReconciliationResult | None = None,
) -> PaymentReconciliationBatchDetailResponse:
    batch = get_reconciliation_batch(db, batch_id)
    if batch is None:
        raise PaymentNotFoundError("对账批次不存在")
    items, total = list_reconciliation_items(db, batch.id, page, page_size, result.value if result else None)
    return PaymentReconciliationBatchDetailResponse(
        batch=reconciliation_batch_to_response(batch),
        items=[reconciliation_item_to_response(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def reconciliation_batch_to_response(item: PaymentReconciliationBatch) -> PaymentReconciliationBatchSummaryResponse:
    return PaymentReconciliationBatchSummaryResponse(
        id=item.id,
        provider=item.provider,
        statement_date=item.statement_date,
        run_status=item.run_status,
        provider_total_count=item.provider_total_count,
        provider_total_amount=item.provider_total_amount,
        system_total_count=item.system_total_count,
        system_total_amount=item.system_total_amount,
        matched_count=item.matched_count,
        amount_mismatch_count=item.amount_mismatch_count,
        status_mismatch_count=item.status_mismatch_count,
        system_only_count=item.system_only_count,
        provider_only_count=item.provider_only_count,
        executed_by_admin_user_id=item.executed_by_admin_user_id,
        executed_at=_utc_value(item.executed_at),
        created_at=_utc_value(item.created_at),
        updated_at=_utc_value(item.updated_at),
    )


def reconciliation_item_to_response(item: PaymentReconciliationItem) -> PaymentReconciliationItemResponse:
    return PaymentReconciliationItemResponse(
        id=item.id,
        payment_transaction_id=item.payment_transaction_id,
        payment_no=item.payment_no,
        provider_transaction_no=item.provider_transaction_no,
        order_no=item.order_no,
        system_amount=item.system_amount,
        provider_amount=item.provider_amount,
        system_status=item.system_status,
        provider_status=item.provider_status,
        result=item.result,
        difference_message=item.difference_message,
        created_at=_utc_value(item.created_at),
        updated_at=_utc_value(item.updated_at),
    )


def attach_payment_transactions_to_order_response(db: Session, response: BillingOrderResponse) -> BillingOrderResponse:
    response.payment_transactions = get_order_payment_transactions(db, response.id)
    return response


def attach_payment_transactions_to_admin_response(db: Session, response: BillingOrderAdminResponse) -> BillingOrderAdminResponse:
    response.payment_transactions = get_order_payment_transactions(db, response.id)
    return response


def generate_payment_no(now: datetime | None = None) -> str:
    utc_now = (now or datetime.now(UTC)).astimezone(UTC)
    suffix = "".join(secrets.choice(PAYMENT_NO_ALPHABET) for _ in range(8))
    return f"PAY{utc_now.strftime('%Y%m%d%H%M%S')}{suffix}"


def _apply_close_result(db: Session, payment_transaction_id: int, result: ClosePaymentResult) -> None:
    payment = get_payment_transaction_by_id(db, payment_transaction_id, for_update=True)
    if payment is None:
        return
    payment.status = result.status.value
    payment.provider_completed_at = _naive_utc(result.completed_at)
    payment.failure_code = result.failure_code
    payment.failure_message = result.failure_message
    payment.updated_at = datetime.now(UTC).replace(tzinfo=None)
    if result.status == PaymentTransactionStatus.SUCCESS:
        _apply_payment_result(
            db,
            payment.id,
            PaymentQueryResult(
                provider=result.provider,
                provider_transaction_no=result.provider_transaction_no,
                payment_no=result.payment_no,
                order_no=result.order_no,
                amount=result.amount,
                currency=result.currency,
                status=result.status,
                completed_at=result.completed_at,
                failure_code=result.failure_code,
                failure_message=result.failure_message,
            ),
            allow_query_side_effects=True,
        )


def _apply_payment_result(
    db: Session,
    payment_transaction_id: int,
    result: PaymentQueryResult | VerifiedPaymentNotification,
    allow_query_side_effects: bool,
) -> None:
    payment = get_payment_transaction_by_id(db, payment_transaction_id, for_update=True)
    if payment is None:
        raise PaymentValidationError("支付记录不存在")
    order = get_order_for_payment_processing(db, payment.order_id, for_update=True)
    if order is None:
        raise PaymentValidationError("订单不存在")

    _validate_verified_notification(payment, result)
    now = datetime.now(UTC).replace(tzinfo=None)
    payment.provider_transaction_no = result.provider_transaction_no
    payment.status = result.status.value
    payment.provider_completed_at = _naive_utc(result.completed_at)
    payment.failure_code = result.failure_code
    payment.failure_message = result.failure_message
    payment.updated_at = now

    if result.status == PaymentTransactionStatus.SUCCESS:
        order.status = BillingOrderStatus.PAID.value
        if order.paid_at is None:
            order.paid_at = _naive_utc(result.completed_at) or now
        if not order.payment_channel:
            order.payment_channel = "EXTERNAL"
        order.updated_at = now
        ensure_prepaid_order_credit_entry(db, order, _utc_value(order.paid_at))
        return

    if result.status == PaymentTransactionStatus.FAILED:
        if order.status != BillingOrderStatus.PAID.value and not order_has_successful_payment(db, order.id):
            order.status = BillingOrderStatus.PAYMENT_FAILED.value
            order.updated_at = now
        return

    if result.status == PaymentTransactionStatus.CLOSED:
        if order.status == BillingOrderStatus.CANCELED.value:
            order.updated_at = now
            return
        if allow_query_side_effects and order.status != BillingOrderStatus.PAID.value and not order_has_successful_payment(db, order.id):
            order.status = BillingOrderStatus.PAYMENT_FAILED.value
            order.updated_at = now


def _validate_verified_notification(
    payment: PaymentTransaction,
    result: PaymentQueryResult | VerifiedPaymentNotification | ClosePaymentResult,
) -> None:
    if payment.provider != result.provider:
        raise PaymentValidationError("支付提供方不匹配")
    if payment.payment_no != result.payment_no:
        raise PaymentValidationError("商户支付号不匹配")
    if payment.order_no != result.order_no:
        raise PaymentValidationError("订单号不匹配")
    if Decimal(payment.amount).quantize(Decimal("0.01")) != Decimal(result.amount).quantize(Decimal("0.01")):
        raise PaymentValidationError("支付金额不匹配")
    if payment.currency != result.currency:
        raise PaymentValidationError("支付币种不匹配")


def _build_reconciliation_items(
    statement_entries: list[StatementEntry],
    system_entries: list[PaymentTransaction],
    batch_id: int,
) -> list[PaymentReconciliationItem]:
    provider_by_tx = {item.provider_transaction_no: item for item in statement_entries}
    provider_by_payment = {item.payment_no: item for item in statement_entries}
    used_provider_keys: set[str] = set()
    items: list[PaymentReconciliationItem] = []

    for system_item in system_entries:
        provider_item = None
        if system_item.provider_transaction_no:
            provider_item = provider_by_tx.get(system_item.provider_transaction_no)
            if provider_item:
                used_provider_keys.add(provider_item.provider_transaction_no)
        if provider_item is None:
            provider_item = provider_by_payment.get(system_item.payment_no)
            if provider_item:
                used_provider_keys.add(provider_item.provider_transaction_no)

        if provider_item is None:
            items.append(
                PaymentReconciliationItem(
                    batch_id=batch_id,
                    payment_transaction_id=system_item.id,
                    payment_no=system_item.payment_no,
                    provider_transaction_no=system_item.provider_transaction_no,
                    order_no=system_item.order_no,
                    system_amount=system_item.amount,
                    provider_amount=None,
                    system_status=system_item.status,
                    provider_status=None,
                    result=PaymentReconciliationResult.SYSTEM_ONLY.value,
                    difference_message="系统存在支付记录，平台账单无对应记录",
                )
            )
            continue

        amount_match = Decimal(system_item.amount).quantize(Decimal("0.01")) == Decimal(provider_item.amount).quantize(Decimal("0.01"))
        status_match = _normalize_statement_status(system_item.status) == _normalize_statement_status(provider_item.status.value)
        if amount_match and status_match:
            result = PaymentReconciliationResult.MATCHED.value
            message = "系统与平台金额、状态一致"
        elif not amount_match:
            result = PaymentReconciliationResult.AMOUNT_MISMATCH.value
            message = "系统与平台金额不一致"
        else:
            result = PaymentReconciliationResult.STATUS_MISMATCH.value
            message = "系统与平台状态不一致"

        items.append(
            PaymentReconciliationItem(
                batch_id=batch_id,
                payment_transaction_id=system_item.id,
                payment_no=system_item.payment_no,
                provider_transaction_no=provider_item.provider_transaction_no,
                order_no=system_item.order_no,
                system_amount=system_item.amount,
                provider_amount=provider_item.amount,
                system_status=system_item.status,
                provider_status=provider_item.status.value,
                result=result,
                difference_message=message,
            )
        )

    for provider_item in statement_entries:
        if provider_item.provider_transaction_no in used_provider_keys:
            continue
        items.append(
            PaymentReconciliationItem(
                batch_id=batch_id,
                payment_transaction_id=None,
                payment_no=provider_item.payment_no,
                provider_transaction_no=provider_item.provider_transaction_no,
                order_no=provider_item.order_no,
                system_amount=None,
                provider_amount=provider_item.amount,
                system_status=None,
                provider_status=provider_item.status.value,
                result=PaymentReconciliationResult.PROVIDER_ONLY.value,
                difference_message="平台账单存在支付记录，系统无对应记录",
            )
        )

    return items


def _populate_batch_summary(
    batch: PaymentReconciliationBatch,
    statement_entries: list[StatementEntry],
    system_entries: list[PaymentTransaction],
    items: list[PaymentReconciliationItem],
) -> None:
    batch.run_status = PaymentReconciliationRunStatus.SUCCESS.value
    batch.provider_total_count = len(statement_entries)
    batch.provider_total_amount = sum((Decimal(item.amount) for item in statement_entries), Decimal("0.00"))
    batch.system_total_count = len(system_entries)
    batch.system_total_amount = sum((Decimal(item.amount) for item in system_entries), Decimal("0.00"))
    batch.matched_count = sum(1 for item in items if item.result == PaymentReconciliationResult.MATCHED.value)
    batch.amount_mismatch_count = sum(1 for item in items if item.result == PaymentReconciliationResult.AMOUNT_MISMATCH.value)
    batch.status_mismatch_count = sum(1 for item in items if item.result == PaymentReconciliationResult.STATUS_MISMATCH.value)
    batch.system_only_count = sum(1 for item in items if item.result == PaymentReconciliationResult.SYSTEM_ONLY.value)
    batch.provider_only_count = sum(1 for item in items if item.result == PaymentReconciliationResult.PROVIDER_ONLY.value)


def _normalize_statement_status(status: str) -> str:
    if status == PaymentTransactionStatus.SUCCESS.value:
        return "SUCCESS"
    if status in {PaymentTransactionStatus.FAILED.value, PaymentTransactionStatus.CLOSED.value}:
        return "FAILED_OR_CLOSED"
    return status


def _safe_body_text(body: bytes) -> str:
    try:
        return body.decode("utf-8")
    except UnicodeDecodeError:
        return body.decode("utf-8", errors="replace")


def _sanitize_headers(headers: Mapping[str, str]) -> dict[str, str]:
    sanitized: dict[str, str] = {}
    for key, value in headers.items():
        if "signature" in key.lower():
            sanitized[key] = "***"
        else:
            sanitized[key] = value
    return sanitized


def _raw_notification_key(headers: Mapping[str, str], body: bytes) -> str:
    for key, value in headers.items():
        if key.lower() == "x-mockpay-notification-id":
            normalized = value.strip()
            if normalized:
                return normalized
    digest = hashlib.sha256(body).hexdigest()[:24]
    return f"invalid-{digest}"


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
