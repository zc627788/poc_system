from datetime import datetime
from decimal import Decimal

from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.models.billing_order import BillingOrder
from app.models.billing_product import BillingProduct
from app.models.consumption_import import ConsumptionImportBatch, ConsumptionImportRow
from app.models.consumption_record import ConsumptionRecord
from app.models.prepaid_ledger_entry import PrepaidLedgerEntry
from app.models.site_user import SiteUser


def get_consumption_import_batch(db: Session, batch_id: int, for_update: bool = False) -> ConsumptionImportBatch | None:
    query = db.query(ConsumptionImportBatch).filter(ConsumptionImportBatch.id == batch_id)
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_consumption_import_batch_by_no(db: Session, batch_no: str) -> ConsumptionImportBatch | None:
    return db.query(ConsumptionImportBatch).filter(ConsumptionImportBatch.batch_no == batch_no).first()


def list_consumption_import_rows(
    db: Session,
    batch_id: int,
    page: int,
    page_size: int,
    row_status: str | None = None,
) -> tuple[list[ConsumptionImportRow], int]:
    query = db.query(ConsumptionImportRow).filter(ConsumptionImportRow.batch_id == batch_id)
    if row_status:
        query = query.filter(ConsumptionImportRow.row_status == row_status)
    total = query.count()
    items = (
        query.order_by(ConsumptionImportRow.row_no.asc(), ConsumptionImportRow.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_import_rows_by_status(
    db: Session,
    batch_id: int,
    row_status: str,
    for_update: bool = False,
) -> list[ConsumptionImportRow]:
    query = (
        db.query(ConsumptionImportRow)
        .filter(ConsumptionImportRow.batch_id == batch_id, ConsumptionImportRow.row_status == row_status)
        .order_by(ConsumptionImportRow.row_no.asc(), ConsumptionImportRow.id.asc())
    )
    if for_update:
        query = query.with_for_update()
    return query.all()


def get_consumption_record_by_unique_key(
    db: Session,
    record_source: str,
    supplier_name: str,
    supplier_record_no: str,
    for_update: bool = False,
) -> ConsumptionRecord | None:
    query = db.query(ConsumptionRecord).filter(
        ConsumptionRecord.record_source == record_source,
        ConsumptionRecord.supplier_name == supplier_name,
        ConsumptionRecord.supplier_record_no == supplier_record_no,
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def get_prepaid_ledger_entry_by_source(
    db: Session,
    source_type: str,
    source_id: int,
    for_update: bool = False,
) -> PrepaidLedgerEntry | None:
    query = db.query(PrepaidLedgerEntry).filter(
        PrepaidLedgerEntry.source_type == source_type,
        PrepaidLedgerEntry.source_id == source_id,
    )
    if for_update:
        query = query.with_for_update()
    return query.first()


def list_paid_prepaid_orders(db: Session) -> list[BillingOrder]:
    return (
        db.query(BillingOrder)
        .filter(
            BillingOrder.billing_mode == "PREPAID",
            BillingOrder.status == "PAID",
        )
        .order_by(BillingOrder.id.asc())
        .all()
    )


def list_site_users_by_phones(db: Session, phones: list[str]) -> list[SiteUser]:
    if not phones:
        return []
    return db.query(SiteUser).filter(SiteUser.phone.in_(phones)).all()


def list_service_reference_products(db: Session, service_codes: list[str]) -> list[BillingProduct]:
    if not service_codes:
        return []
    subquery = (
        db.query(
            BillingProduct.service_code.label("service_code"),
            func.min(BillingProduct.id).label("min_id"),
        )
        .filter(BillingProduct.service_code.in_(service_codes))
        .group_by(BillingProduct.service_code)
        .subquery()
    )
    return (
        db.query(BillingProduct)
        .join(subquery, BillingProduct.id == subquery.c.min_id)
        .all()
    )


def list_orders_by_order_nos(db: Session, order_nos: list[str]) -> list[BillingOrder]:
    if not order_nos:
        return []
    return db.query(BillingOrder).filter(BillingOrder.order_no.in_(order_nos)).all()


def list_public_balances(db: Session, site_user_id: int) -> list[tuple[str, str, Decimal, Decimal, datetime | None]]:
    credit_amount = case((PrepaidLedgerEntry.entry_type == "CREDIT", PrepaidLedgerEntry.amount), else_=Decimal("0.00"))
    debit_amount = case((PrepaidLedgerEntry.entry_type == "DEBIT", PrepaidLedgerEntry.amount), else_=Decimal("0.00"))
    return (
        db.query(
            PrepaidLedgerEntry.service_code,
            func.max(PrepaidLedgerEntry.service_name).label("service_name"),
            func.coalesce(func.sum(credit_amount), Decimal("0.00")).label("total_recharged"),
            func.coalesce(func.sum(debit_amount), Decimal("0.00")).label("total_consumed"),
            func.max(PrepaidLedgerEntry.created_at).label("last_updated_at"),
        )
        .filter(PrepaidLedgerEntry.site_user_id == site_user_id)
        .group_by(PrepaidLedgerEntry.service_code)
        .order_by(PrepaidLedgerEntry.service_code.asc())
        .all()
    )


def list_admin_balances(
    db: Session,
    page: int,
    page_size: int,
    user_keyword: str | None = None,
    service_code: str | None = None,
    insufficient: bool | None = None,
) -> tuple[list, int]:
    credit_amount = case((PrepaidLedgerEntry.entry_type == "CREDIT", PrepaidLedgerEntry.amount), else_=Decimal("0.00"))
    debit_amount = case((PrepaidLedgerEntry.entry_type == "DEBIT", PrepaidLedgerEntry.amount), else_=Decimal("0.00"))
    balance_subquery = (
        db.query(
            PrepaidLedgerEntry.site_user_id.label("site_user_id"),
            PrepaidLedgerEntry.service_code.label("service_code"),
            func.max(PrepaidLedgerEntry.service_name).label("service_name"),
            func.coalesce(func.sum(credit_amount), Decimal("0.00")).label("total_recharged"),
            func.coalesce(func.sum(debit_amount), Decimal("0.00")).label("total_consumed"),
            func.max(PrepaidLedgerEntry.created_at).label("last_updated_at"),
        )
        .group_by(PrepaidLedgerEntry.site_user_id, PrepaidLedgerEntry.service_code)
        .subquery()
    )
    remaining_balance = (balance_subquery.c.total_recharged - balance_subquery.c.total_consumed).label("remaining_balance")
    query = db.query(
        balance_subquery.c.site_user_id,
        SiteUser.name,
        SiteUser.phone,
        SiteUser.mobile_fuzzy,
        balance_subquery.c.service_code,
        balance_subquery.c.service_name,
        balance_subquery.c.total_recharged,
        balance_subquery.c.total_consumed,
        remaining_balance,
        balance_subquery.c.last_updated_at,
    ).join(SiteUser, SiteUser.id == balance_subquery.c.site_user_id)
    if user_keyword:
        like_value = f"%{user_keyword.strip()}%"
        query = query.filter(or_(SiteUser.name.like(like_value), SiteUser.phone.like(like_value)))
    if service_code:
        query = query.filter(balance_subquery.c.service_code == service_code)
    if insufficient is True:
        query = query.filter(remaining_balance < 0)
    if insufficient is False:
        query = query.filter(remaining_balance >= 0)
    total = query.count()
    items = (
        query.order_by(remaining_balance.asc(), balance_subquery.c.last_updated_at.desc(), balance_subquery.c.site_user_id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_public_consumptions(
    db: Session,
    site_user_id: int,
    page: int,
    page_size: int,
    service_code: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    order_no: str | None = None,
) -> tuple[list, int, Decimal]:
    query = db.query(ConsumptionRecord, BillingOrder.order_no).outerjoin(BillingOrder, BillingOrder.id == ConsumptionRecord.order_id)
    query = query.filter(ConsumptionRecord.site_user_id == site_user_id)
    if service_code:
        query = query.filter(ConsumptionRecord.service_code == service_code)
    if start_at:
        query = query.filter(ConsumptionRecord.consumed_at >= start_at)
    if end_at:
        query = query.filter(ConsumptionRecord.consumed_at <= end_at)
    if order_no:
        query = query.filter(BillingOrder.order_no == order_no)
    total = query.count()
    total_amount = query.with_entities(func.coalesce(func.sum(ConsumptionRecord.amount), Decimal("0.00"))).scalar() or Decimal("0.00")
    items = (
        query.order_by(ConsumptionRecord.consumed_at.desc(), ConsumptionRecord.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total, total_amount


def list_admin_consumptions(
    db: Session,
    page: int,
    page_size: int,
    user_keyword: str | None = None,
    service_code: str | None = None,
    supplier_name: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    order_no: str | None = None,
) -> tuple[list, int, Decimal]:
    query = (
        db.query(ConsumptionRecord, SiteUser.name, SiteUser.phone, SiteUser.mobile_fuzzy, BillingOrder.order_no)
        .join(SiteUser, SiteUser.id == ConsumptionRecord.site_user_id)
        .outerjoin(BillingOrder, BillingOrder.id == ConsumptionRecord.order_id)
    )
    if user_keyword:
        like_value = f"%{user_keyword.strip()}%"
        query = query.filter(or_(SiteUser.name.like(like_value), SiteUser.phone.like(like_value)))
    if service_code:
        query = query.filter(ConsumptionRecord.service_code == service_code)
    if supplier_name:
        query = query.filter(ConsumptionRecord.supplier_name.like(f"%{supplier_name.strip()}%"))
    if start_at:
        query = query.filter(ConsumptionRecord.consumed_at >= start_at)
    if end_at:
        query = query.filter(ConsumptionRecord.consumed_at <= end_at)
    if order_no:
        query = query.filter(BillingOrder.order_no == order_no)
    total = query.count()
    total_amount = query.with_entities(func.coalesce(func.sum(ConsumptionRecord.amount), Decimal("0.00"))).scalar() or Decimal("0.00")
    items = (
        query.order_by(ConsumptionRecord.consumed_at.desc(), ConsumptionRecord.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total, total_amount
