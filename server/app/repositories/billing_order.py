from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.billing_order import BillingOrder
from app.models.site_user import SiteUser


def get_order_by_user_request(db: Session, site_user_id: int, request_id: str) -> BillingOrder | None:
    return (
        db.query(BillingOrder)
        .filter(BillingOrder.site_user_id == site_user_id, BillingOrder.request_id == request_id)
        .first()
    )


def get_user_order(db: Session, order_id: int, site_user_id: int, for_update: bool = False) -> BillingOrder | None:
    query = db.query(BillingOrder).filter(BillingOrder.id == order_id, BillingOrder.site_user_id == site_user_id)
    if for_update:
        query = query.with_for_update()
    return query.first()


def list_user_orders(
    db: Session,
    site_user_id: int,
    page: int,
    page_size: int,
    status: str | None = None,
) -> tuple[list[BillingOrder], int]:
    query = db.query(BillingOrder).filter(BillingOrder.site_user_id == site_user_id)
    if status:
        query = query.filter(BillingOrder.status == status)
    total = query.count()
    items = (
        query.order_by(BillingOrder.created_at.desc(), BillingOrder.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_admin_orders(
    db: Session,
    page: int,
    page_size: int,
    order_no: str | None = None,
    user_keyword: str | None = None,
    product_id: int | None = None,
    status: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> tuple[list[tuple[BillingOrder, SiteUser]], int]:
    query = db.query(BillingOrder, SiteUser).join(SiteUser, SiteUser.id == BillingOrder.site_user_id)
    if order_no:
        query = query.filter(BillingOrder.order_no.like(f"%{order_no.strip()}%"))
    if user_keyword:
        keyword = f"%{user_keyword.strip()}%"
        query = query.filter(or_(SiteUser.name.like(keyword), SiteUser.phone.like(keyword)))
    if product_id is not None:
        query = query.filter(BillingOrder.product_id == product_id)
    if status:
        query = query.filter(BillingOrder.status == status)
    if start_at:
        query = query.filter(BillingOrder.created_at >= start_at)
    if end_at:
        query = query.filter(BillingOrder.created_at <= end_at)
    total = query.count()
    items = (
        query.order_by(BillingOrder.created_at.desc(), BillingOrder.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_admin_order(db: Session, order_id: int) -> tuple[BillingOrder, SiteUser] | None:
    return (
        db.query(BillingOrder, SiteUser)
        .join(SiteUser, SiteUser.id == BillingOrder.site_user_id)
        .filter(BillingOrder.id == order_id)
        .first()
    )
