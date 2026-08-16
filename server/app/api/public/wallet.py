from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.wallet import (
    WalletLedgerListResponse,
    WalletRechargeLaunchRequest,
    WalletRechargeLaunchResponse,
    WalletRechargePaymentStatusResponse,
    WalletSummaryResponse,
    WalletTransactionListResponse,
    WalletTransactionType,
)
from app.services.wallet import (
    WalletConflictError,
    WalletNotFoundError,
    WalletValidationError,
    get_wallet_ledger_records,
    get_wallet_recharge_payment_status,
    get_wallet_summary,
    get_wallet_transactions,
    launch_wallet_recharge,
)


router = APIRouter(prefix="/wallet")


def _raise_wallet_error(exc: ValueError) -> None:
    if isinstance(exc, WalletNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, WalletConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/summary", response_model=ApiResponse[WalletSummaryResponse])
def get_public_wallet_summary(
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[WalletSummaryResponse]:
    return ApiResponse(data=get_wallet_summary(db, site_user_id))


@router.get("/records", response_model=ApiResponse[WalletLedgerListResponse])
def list_public_wallet_records(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[WalletLedgerListResponse]:
    return ApiResponse(data=get_wallet_ledger_records(db, site_user_id, page, page_size))


@router.get("/transactions", response_model=ApiResponse[WalletTransactionListResponse])
def list_public_wallet_transactions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    transaction_type: WalletTransactionType | None = Query(default=None),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[WalletTransactionListResponse]:
    return ApiResponse(data=get_wallet_transactions(db, site_user_id, page, page_size, transaction_type))


@router.post("/recharges/launch", response_model=ApiResponse[WalletRechargeLaunchResponse])
def launch_public_wallet_recharge(
    request: Request,
    raw_payload: dict = Body(...),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[WalletRechargeLaunchResponse]:
    try:
        payload = WalletRechargeLaunchRequest.model_validate(raw_payload)
        return ApiResponse(data=launch_wallet_recharge(db, site_user_id, payload, idempotency_key, str(request.base_url)))
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.errors()[0].get("msg", "请求参数不合法")) from exc
    except (WalletValidationError, WalletConflictError, WalletNotFoundError) as exc:
        _raise_wallet_error(exc)


@router.get("/recharges/{recharge_id}/payment-status", response_model=ApiResponse[WalletRechargePaymentStatusResponse])
def get_public_wallet_recharge_payment_status(
    recharge_id: int,
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[WalletRechargePaymentStatusResponse]:
    try:
        return ApiResponse(data=get_wallet_recharge_payment_status(db, recharge_id, site_user_id))
    except (WalletValidationError, WalletConflictError, WalletNotFoundError) as exc:
        _raise_wallet_error(exc)
