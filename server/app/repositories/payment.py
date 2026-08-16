from datetime import date, datetime, timedelta, timezone

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.billing_order import BillingOrder
from app.models.mock_payment_transaction import MockPaymentTransaction
from app.models.payment_notification import PaymentNotification
from app.models.payment_reconciliation import PaymentReconciliationBatch, PaymentReconciliationItem
from app.models.payment_transaction import PaymentTransaction


def get_latest_order_payment_transaction(
    db: Session,
    order_id: int,
    for_update: bool = False,
) -> PaymentTransaction | None:
    query = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.order_id == order_id)
        .order_by(PaymentTransaction.created_at.desc(), PaymentTransaction.id.desc())
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def list_order_payment_transactions(
    db: Session,
    order_id: int,
) -> list[PaymentTransaction]:
    return (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.order_id == order_id)
        .order_by(PaymentTransaction.created_at.desc(), PaymentTransaction.id.desc())
        .all()
    )


def get_pending_order_payment_transaction(
    db: Session,
    order_id: int,
    for_update: bool = False,
) -> PaymentTransaction | None:
    query = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.order_id == order_id,
            PaymentTransaction.status.in_(["CREATED", "PENDING"]),
        )
        .order_by(PaymentTransaction.created_at.desc(), PaymentTransaction.id.desc())
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_payment_transaction_by_id(db: Session, payment_transaction_id: int, for_update: bool = False) -> PaymentTransaction | None:
    query = db.query(PaymentTransaction).filter(PaymentTransaction.id == payment_transaction_id)
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_payment_transaction_by_payment_no(db: Session, payment_no: str, for_update: bool = False) -> PaymentTransaction | None:
    query = db.query(PaymentTransaction).filter(PaymentTransaction.payment_no == payment_no)
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_payment_transaction_by_provider_tx(
    db: Session,
    provider: str,
    provider_transaction_no: str,
    for_update: bool = False,
) -> PaymentTransaction | None:
    query = db.query(PaymentTransaction).filter(
        PaymentTransaction.provider == provider,
        PaymentTransaction.provider_transaction_no == provider_transaction_no,
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def order_has_successful_payment(db: Session, order_id: int) -> bool:
    return (
        db.query(PaymentTransaction.id)
        .filter(PaymentTransaction.order_id == order_id, PaymentTransaction.status == "SUCCESS")
        .first()
        is not None
    )


def get_payment_notification_by_key(
    db: Session,
    provider: str,
    notification_id: str,
    for_update: bool = False,
) -> PaymentNotification | None:
    query = db.query(PaymentNotification).filter(
        PaymentNotification.provider == provider,
        PaymentNotification.notification_id == notification_id,
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_reconciliation_batch(
    db: Session,
    batch_id: int,
) -> PaymentReconciliationBatch | None:
    return db.query(PaymentReconciliationBatch).filter(PaymentReconciliationBatch.id == batch_id).first()


def get_reconciliation_batch_by_provider_date(
    db: Session,
    provider: str,
    statement_date: date,
    for_update: bool = False,
) -> PaymentReconciliationBatch | None:
    query = db.query(PaymentReconciliationBatch).filter(
        PaymentReconciliationBatch.provider == provider,
        PaymentReconciliationBatch.statement_date == statement_date,
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def list_reconciliation_batches(
    db: Session,
    page: int,
    page_size: int,
    provider: str | None = None,
    statement_date: date | None = None,
) -> tuple[list[PaymentReconciliationBatch], int]:
    query = db.query(PaymentReconciliationBatch)
    if provider:
        query = query.filter(PaymentReconciliationBatch.provider == provider)
    if statement_date:
        query = query.filter(PaymentReconciliationBatch.statement_date == statement_date)
    total = query.count()
    items = (
        query.order_by(PaymentReconciliationBatch.statement_date.desc(), PaymentReconciliationBatch.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_reconciliation_items(
    db: Session,
    batch_id: int,
    page: int,
    page_size: int,
    result: str | None = None,
) -> tuple[list[PaymentReconciliationItem], int]:
    query = db.query(PaymentReconciliationItem).filter(PaymentReconciliationItem.batch_id == batch_id)
    if result:
        query = query.filter(PaymentReconciliationItem.result == result)
    total = query.count()
    items = (
        query.order_by(PaymentReconciliationItem.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_mock_payment_transaction_by_token(db: Session, checkout_token: str, for_update: bool = False) -> MockPaymentTransaction | None:
    query = db.query(MockPaymentTransaction).filter(MockPaymentTransaction.checkout_token == checkout_token)
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_mock_payment_transaction_by_provider_tx(
    db: Session,
    provider_transaction_no: str,
    for_update: bool = False,
) -> MockPaymentTransaction | None:
    query = db.query(MockPaymentTransaction).filter(MockPaymentTransaction.provider_transaction_no == provider_transaction_no)
    if for_update:
        query = query.with_for_update()
    return query.first()


def list_due_mock_payment_transactions(
    db: Session,
    now: datetime,
) -> list[MockPaymentTransaction]:
    return (
        db.query(MockPaymentTransaction)
        .filter(
            MockPaymentTransaction.notification_status == "SCHEDULED",
            MockPaymentTransaction.notification_due_at.is_not(None),
            MockPaymentTransaction.notification_due_at <= now,
        )
        .order_by(MockPaymentTransaction.notification_due_at.asc(), MockPaymentTransaction.id.asc())
        .all()
    )


def list_mock_statement_transactions(db: Session, statement_date: date) -> list[MockPaymentTransaction]:
    start = datetime.combine(statement_date, datetime.min.time())
    end = start + timedelta(days=1)
    return (
        db.query(MockPaymentTransaction)
        .filter(
            MockPaymentTransaction.completed_at.is_not(None),
            MockPaymentTransaction.completed_at >= start,
            MockPaymentTransaction.completed_at < end,
        )
        .order_by(MockPaymentTransaction.completed_at.asc(), MockPaymentTransaction.id.asc())
        .all()
    )


def list_system_statement_transactions(db: Session, provider: str, statement_date: date) -> list[PaymentTransaction]:
    start = datetime.combine(statement_date, datetime.min.time())
    end = start + timedelta(days=1)
    return (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.provider == provider,
            or_(
                and_(
                    PaymentTransaction.provider_completed_at.is_not(None),
                    PaymentTransaction.provider_completed_at >= start,
                    PaymentTransaction.provider_completed_at < end,
                ),
                and_(
                    PaymentTransaction.provider_completed_at.is_(None),
                    PaymentTransaction.created_at >= start,
                    PaymentTransaction.created_at < end,
                ),
            ),
        )
        .order_by(PaymentTransaction.created_at.asc(), PaymentTransaction.id.asc())
        .all()
    )


def delete_reconciliation_items(db: Session, batch_id: int) -> None:
    db.query(PaymentReconciliationItem).filter(PaymentReconciliationItem.batch_id == batch_id).delete()


def get_order_for_payment_processing(db: Session, order_id: int, for_update: bool = False) -> BillingOrder | None:
    query = db.query(BillingOrder).filter(BillingOrder.id == order_id)
    if for_update:
        query = query.with_for_update()
    return query.first()
