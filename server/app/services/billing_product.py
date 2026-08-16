from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.billing_product import BillingProduct
from app.repositories.billing_product import (
    get_billing_product_by_code,
    get_billing_product_by_id,
    get_service_reference_product,
    list_admin_billing_products,
    list_public_billing_products,
)
from app.schemas.billing import (
    BillingMode,
    BillingProductAdminResponse,
    BillingProductCreateRequest,
    BillingProductListResponse,
    BillingProductPublicResponse,
    BillingProductStatus,
    BillingProductUpdateRequest,
)


class BillingProductNotFoundError(ValueError):
    pass


class BillingProductConflictError(ValueError):
    pass


def _public_response(item: BillingProduct) -> BillingProductPublicResponse:
    return BillingProductPublicResponse(
        id=item.id,
        product_code=item.product_code,
        service_code=item.service_code,
        service_name=item.service_name,
        supplier_name=item.supplier_name,
        name=item.name,
        description=item.description,
        billing_mode=item.billing_mode,
        price=item.price,
        currency=item.currency,
    )


def _admin_response(item: BillingProduct) -> BillingProductAdminResponse:
    return BillingProductAdminResponse(
        **_public_response(item).model_dump(),
        sort_order=item.sort_order,
        status=item.status,
        created_by=item.created_by,
        updated_by=item.updated_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _ensure_service_consistency(
    db: Session,
    service_code: str,
    service_name: str,
    supplier_name: str,
    exclude_product_id: int | None = None,
) -> None:
    reference = get_service_reference_product(db, service_code, exclude_product_id)
    if reference is None:
        return
    if reference.service_name != service_name or reference.supplier_name != supplier_name:
        raise BillingProductConflictError("同一服务编码必须使用相同的服务名称和供应商名称")


def get_public_products(db: Session, billing_mode: BillingMode | None = None) -> list[BillingProductPublicResponse]:
    items = list_public_billing_products(db, billing_mode.value if billing_mode else None)
    return [_public_response(item) for item in items]


def get_public_product(db: Session, product_id: int) -> BillingProductPublicResponse:
    item = get_billing_product_by_id(db, product_id)
    if item is None or item.status != BillingProductStatus.ON_SALE.value:
        raise BillingProductNotFoundError("商品不存在")
    return _public_response(item)


def get_admin_products(
    db: Session,
    page: int,
    page_size: int,
    keyword: str | None = None,
    billing_mode: BillingMode | None = None,
    status: BillingProductStatus | None = None,
) -> BillingProductListResponse:
    items, total = list_admin_billing_products(
        db,
        page,
        page_size,
        keyword,
        billing_mode.value if billing_mode else None,
        status.value if status else None,
    )
    return BillingProductListResponse(
        items=[_admin_response(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def create_admin_product(
    db: Session,
    payload: BillingProductCreateRequest,
    admin_user_id: int,
) -> BillingProductAdminResponse:
    if get_billing_product_by_code(db, payload.product_code) is not None:
        raise BillingProductConflictError("商品编码已存在")
    _ensure_service_consistency(db, payload.service_code, payload.service_name, payload.supplier_name)
    item = BillingProduct(
        **payload.model_dump(mode="json"),
        currency="CNY",
        created_by=admin_user_id,
        updated_by=admin_user_id,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise BillingProductConflictError("商品编码已存在") from exc
    db.refresh(item)
    return _admin_response(item)


def update_admin_product(
    db: Session,
    product_id: int,
    payload: BillingProductUpdateRequest,
    admin_user_id: int,
) -> BillingProductAdminResponse:
    item = get_billing_product_by_id(db, product_id)
    if item is None:
        raise BillingProductNotFoundError("商品不存在")
    if payload.product_code is not None and payload.product_code != item.product_code:
        raise BillingProductConflictError("商品编码创建后不可修改")
    _ensure_service_consistency(
        db,
        payload.service_code,
        payload.service_name,
        payload.supplier_name,
        exclude_product_id=item.id,
    )
    values = payload.model_dump(exclude={"product_code"}, mode="json")
    for key, value in values.items():
        setattr(item, key, value)
    item.updated_by = admin_user_id
    db.commit()
    db.refresh(item)
    return _admin_response(item)


def update_admin_product_status(
    db: Session,
    product_id: int,
    product_status: BillingProductStatus,
    admin_user_id: int,
) -> BillingProductAdminResponse:
    item = get_billing_product_by_id(db, product_id)
    if item is None:
        raise BillingProductNotFoundError("商品不存在")
    item.status = product_status.value
    item.updated_by = admin_user_id
    db.commit()
    db.refresh(item)
    return _admin_response(item)
