from datetime import date

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.payment import (
    PaymentProviderCode,
    PaymentReconciliationBatchDetailResponse,
    PaymentReconciliationBatchListResponse,
    PaymentReconciliationCreateRequest,
    PaymentReconciliationResult,
    PaymentReconciliationBatchSummaryResponse,
)
from app.services.billing_payment import PaymentNotFoundError, run_reconciliation, get_reconciliation_detail, get_reconciliations


router = APIRouter(prefix="/billing/reconciliations")


@router.post("", response_model=ApiResponse[PaymentReconciliationBatchSummaryResponse])
def create_reconciliation(
    payload: PaymentReconciliationCreateRequest = Body(...),
    auth: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[PaymentReconciliationBatchSummaryResponse]:
    return ApiResponse(data=run_reconciliation(db, auth.user_id, payload))


@router.get("", response_model=ApiResponse[PaymentReconciliationBatchListResponse])
def list_reconciliations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    provider: PaymentProviderCode | None = Query(default=None),
    statement_date: date | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[PaymentReconciliationBatchListResponse]:
    return ApiResponse(data=get_reconciliations(db, page, page_size, provider, statement_date))


@router.get("/{batch_id}", response_model=ApiResponse[PaymentReconciliationBatchDetailResponse])
def get_reconciliation(
    batch_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    result: PaymentReconciliationResult | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[PaymentReconciliationBatchDetailResponse]:
    try:
        return ApiResponse(data=get_reconciliation_detail(db, batch_id, page, page_size, result))
    except PaymentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
