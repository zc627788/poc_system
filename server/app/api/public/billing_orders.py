from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.billing_order import BillingOrderCreateRequest, BillingOrderListResponse, BillingOrderResponse, BillingOrderStatus
from app.schemas.common import ApiResponse
from app.schemas.payment import (
    BillingOrderPaymentStatusResponse,
    OrderPaymentMethod,
    PaymentLaunchRequest,
    PaymentLaunchResponse,
)
from app.services.billing_order import (
    BillingOrderConflictError,
    BillingOrderNotFoundError,
    BillingOrderValidationError,
    cancel_order,
    create_order,
    get_order,
    get_orders,
)
from app.services.billing_payment import (
    PaymentConflictError,
    PaymentNotFoundError,
    PaymentValidationError,
    start_order_payment,
    get_order_payment_status,
)


router = APIRouter(prefix="/billing/orders")


def _raise_order_error(exc: ValueError) -> None:
    if isinstance(exc, BillingOrderNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, BillingOrderConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("", response_model=ApiResponse[BillingOrderResponse])
def create_billing_order(
    raw_payload: dict = Body(...),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderResponse]:
    try:
        payload = BillingOrderCreateRequest.model_validate(raw_payload)
        return ApiResponse(data=create_order(db, site_user_id, payload, idempotency_key))
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.errors()[0].get("msg", "请求参数不合法")) from exc
    except (BillingOrderValidationError, BillingOrderNotFoundError, BillingOrderConflictError) as exc:
        _raise_order_error(exc)


@router.get("", response_model=ApiResponse[BillingOrderListResponse])
def list_billing_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    order_status: BillingOrderStatus | None = Query(default=None, alias="status"),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderListResponse]:
    return ApiResponse(data=get_orders(db, site_user_id, page, page_size, order_status))


@router.get("/{order_id}", response_model=ApiResponse[BillingOrderResponse])
def get_billing_order(
    order_id: int,
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderResponse]:
    try:
        return ApiResponse(data=get_order(db, order_id, site_user_id))
    except BillingOrderNotFoundError as exc:
        _raise_order_error(exc)


@router.post("/{order_id}/cancel", response_model=ApiResponse[BillingOrderResponse])
def cancel_billing_order(
    order_id: int,
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderResponse]:
    try:
        return ApiResponse(data=cancel_order(db, order_id, site_user_id))
    except (BillingOrderNotFoundError, BillingOrderConflictError) as exc:
        _raise_order_error(exc)


@router.post("/{order_id}/pay", response_model=ApiResponse[PaymentLaunchResponse])
def pay_billing_order(
    order_id: int,
    request: Request,
    raw_payload: dict | None = Body(default=None),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[PaymentLaunchResponse]:
    try:
        payload = PaymentLaunchRequest.model_validate(raw_payload or {})
        return ApiResponse(
            data=start_order_payment(
                db,
                order_id,
                site_user_id,
                str(request.base_url),
                payload.payment_method,
            )
        )
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.errors()[0].get("msg", "请求参数不合法")) from exc
    except PaymentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PaymentConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except PaymentValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{order_id}/payment-status", response_model=ApiResponse[BillingOrderPaymentStatusResponse])
def get_billing_order_payment_status(
    order_id: int,
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[BillingOrderPaymentStatusResponse]:
    try:
        return ApiResponse(data=get_order_payment_status(db, order_id, site_user_id))
    except PaymentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
