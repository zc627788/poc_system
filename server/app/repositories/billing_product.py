from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.billing_product import BillingProduct


def get_billing_product_by_id(db: Session, product_id: int) -> BillingProduct | None:
    return db.query(BillingProduct).filter(BillingProduct.id == product_id).first()


def get_billing_product_by_code(db: Session, product_code: str) -> BillingProduct | None:
    return db.query(BillingProduct).filter(BillingProduct.product_code == product_code).first()


def get_service_reference_product(
    db: Session,
    service_code: str,
    exclude_product_id: int | None = None,
) -> BillingProduct | None:
    query = db.query(BillingProduct).filter(BillingProduct.service_code == service_code)
    if exclude_product_id is not None:
        query = query.filter(BillingProduct.id != exclude_product_id)
    return query.order_by(BillingProduct.id.asc()).first()


def list_public_billing_products(db: Session, billing_mode: str | None = None) -> list[BillingProduct]:
    query = db.query(BillingProduct).filter(BillingProduct.status == "ON_SALE")
    if billing_mode:
        query = query.filter(BillingProduct.billing_mode == billing_mode)
    return query.order_by(BillingProduct.sort_order.asc(), BillingProduct.id.asc()).all()


def list_admin_billing_products(
    db: Session,
    page: int,
    page_size: int,
    keyword: str | None = None,
    billing_mode: str | None = None,
    status: str | None = None,
) -> tuple[list[BillingProduct], int]:
    query = db.query(BillingProduct)
    if keyword:
        like_value = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                BillingProduct.product_code.like(like_value),
                BillingProduct.name.like(like_value),
                BillingProduct.service_code.like(like_value),
                BillingProduct.service_name.like(like_value),
            )
        )
    if billing_mode:
        query = query.filter(BillingProduct.billing_mode == billing_mode)
    if status:
        query = query.filter(BillingProduct.status == status)

    total = query.count()
    items = (
        query.order_by(BillingProduct.sort_order.asc(), BillingProduct.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total
