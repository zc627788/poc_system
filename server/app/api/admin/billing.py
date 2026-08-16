from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.schemas.billing import (
    BillingMode,
    BillingProductAdminResponse,
    BillingProductCreateRequest,
    BillingProductListResponse,
    BillingProductStatus,
    BillingProductStatusRequest,
    BillingProductUpdateRequest,
)
from app.schemas.common import ApiResponse
from app.services.billing_product import (
    BillingProductConflictError,
    BillingProductNotFoundError,
    create_admin_product,
    get_admin_products,
    update_admin_product,
    update_admin_product_status,
)


router = APIRouter(prefix="/billing/products")


def _parse_payload(model: type[BaseModel], payload: dict) -> BaseModel:
    try:
        return model.model_validate(payload)
    except ValidationError as exc:
        first_error = exc.errors()[0]
        detail = first_error.get("msg", "请求参数不合法")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc


def _raise_service_error(exc: ValueError) -> None:
    if isinstance(exc, BillingProductNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, BillingProductConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("", response_model=ApiResponse[BillingProductListResponse])
def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str | None = Query(default=None),
    billing_mode: BillingMode | None = Query(default=None),
    product_status: BillingProductStatus | None = Query(default=None, alias="status"),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingProductListResponse]:
    return ApiResponse(data=get_admin_products(db, page, page_size, keyword, billing_mode, product_status))


@router.post("", response_model=ApiResponse[BillingProductAdminResponse])
def create_product(
    raw_payload: dict = Body(...),
    admin: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingProductAdminResponse]:
    payload = _parse_payload(BillingProductCreateRequest, raw_payload)
    try:
        return ApiResponse(data=create_admin_product(db, payload, admin.user_id))
    except ValueError as exc:
        _raise_service_error(exc)


@router.put("/{product_id}", response_model=ApiResponse[BillingProductAdminResponse])
def update_product(
    product_id: int,
    raw_payload: dict = Body(...),
    admin: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingProductAdminResponse]:
    payload = _parse_payload(BillingProductUpdateRequest, raw_payload)
    try:
        return ApiResponse(data=update_admin_product(db, product_id, payload, admin.user_id))
    except ValueError as exc:
        _raise_service_error(exc)


@router.put("/{product_id}/status", response_model=ApiResponse[BillingProductAdminResponse])
def update_product_status(
    product_id: int,
    raw_payload: dict = Body(...),
    admin: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingProductAdminResponse]:
    payload = _parse_payload(BillingProductStatusRequest, raw_payload)
    try:
        return ApiResponse(data=update_admin_product_status(db, product_id, payload.status, admin.user_id))
    except ValueError as exc:
        _raise_service_error(exc)
