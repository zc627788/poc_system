from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.schemas.billing_order import BillingOrderAdminListResponse, BillingOrderAdminResponse, BillingOrderStatus
from app.schemas.common import ApiResponse
from app.services.billing_order import BillingOrderNotFoundError, get_admin_order_detail, get_admin_orders


router = APIRouter(prefix="/billing/orders")


@router.get("", response_model=ApiResponse[BillingOrderAdminListResponse])
def list_billing_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    order_no: str | None = Query(default=None),
    user_keyword: str | None = Query(default=None),
    product_id: int | None = Query(default=None, ge=1),
    order_status: BillingOrderStatus | None = Query(default=None, alias="status"),
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderAdminListResponse]:
    if start_at and end_at and start_at > end_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于结束时间")
    return ApiResponse(
        data=get_admin_orders(db, page, page_size, order_no, user_keyword, product_id, order_status, start_at, end_at)
    )


@router.get("/{order_id}", response_model=ApiResponse[BillingOrderAdminResponse])
def get_billing_order(
    order_id: int,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderAdminResponse]:
    try:
        return ApiResponse(data=get_admin_order_detail(db, order_id))
    except BillingOrderNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
