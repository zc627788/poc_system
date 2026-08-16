from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.prepaid_billing import (
    AdminBalanceListResponse,
    ConsumptionImportBatchDetailResponse,
    ConsumptionImportBatchSummaryResponse,
    ConsumptionImportRowStatus,
    ConsumptionRecordListResponse,
)
from app.schemas.wallet import AdminWalletLedgerListResponse, AdminWalletRechargeListResponse
from app.services.prepaid_billing import (
    PrepaidBillingConflictError,
    PrepaidBillingNotFoundError,
    PrepaidBillingValidationError,
    build_consumption_import_errors_workbook,
    build_consumption_import_template,
    confirm_consumption_import,
    get_admin_balance_summaries,
    get_admin_consumption_records,
    get_consumption_import_batch_detail,
    list_consumption_import_errors,
    preview_consumption_import,
)
from app.services.wallet import list_admin_wallet_ledger, list_admin_wallet_recharges


router = APIRouter(prefix="/billing")


def _raise_prepaid_error(exc: ValueError) -> None:
    if isinstance(exc, PrepaidBillingNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, PrepaidBillingConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/consumption-imports/template")
def download_consumption_template(
    _: AdminAuthContext = Depends(require_admin_auth_context),
) -> Response:
    file_bytes = build_consumption_import_template()
    filename = f"opc-consumption-import-template-{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    encoded_filename = quote(filename)
    headers = {"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.post("/consumption-imports/preview", response_model=ApiResponse[ConsumptionImportBatchDetailResponse])
async def preview_consumption_file(
    file: UploadFile = File(...),
    auth: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[ConsumptionImportBatchDetailResponse]:
    file_bytes = await file.read()
    try:
        return ApiResponse(data=preview_consumption_import(db, auth.user_id, file.filename or "", file_bytes))
    except (PrepaidBillingValidationError, PrepaidBillingConflictError, PrepaidBillingNotFoundError) as exc:
        _raise_prepaid_error(exc)


@router.post("/consumption-imports/{batch_id}/confirm", response_model=ApiResponse[ConsumptionImportBatchSummaryResponse])
def confirm_consumption_batch(
    batch_id: int,
    auth: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[ConsumptionImportBatchSummaryResponse]:
    try:
        return ApiResponse(data=confirm_consumption_import(db, batch_id, auth.user_id))
    except (PrepaidBillingValidationError, PrepaidBillingConflictError, PrepaidBillingNotFoundError) as exc:
        _raise_prepaid_error(exc)


@router.get("/consumption-imports/{batch_id}", response_model=ApiResponse[ConsumptionImportBatchDetailResponse])
def get_consumption_batch(
    batch_id: int,
    row_status: ConsumptionImportRowStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[ConsumptionImportBatchDetailResponse]:
    try:
        return ApiResponse(data=get_consumption_import_batch_detail(db, batch_id, row_status, page, page_size))
    except (PrepaidBillingValidationError, PrepaidBillingConflictError, PrepaidBillingNotFoundError) as exc:
        _raise_prepaid_error(exc)


@router.get("/consumption-imports/{batch_id}/errors")
def download_consumption_batch_errors(
    batch_id: int,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> Response:
    try:
        rows = list_consumption_import_errors(db, batch_id)
    except (PrepaidBillingValidationError, PrepaidBillingConflictError, PrepaidBillingNotFoundError) as exc:
        _raise_prepaid_error(exc)
    file_bytes = build_consumption_import_errors_workbook(rows)
    filename = f"opc-consumption-import-errors-{batch_id}.xlsx"
    encoded_filename = quote(filename)
    headers = {"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )


@router.get("/consumptions", response_model=ApiResponse[ConsumptionRecordListResponse])
def list_admin_consumptions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_keyword: str | None = Query(default=None),
    service_code: str | None = Query(default=None),
    supplier_name: str | None = Query(default=None),
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    order_no: str | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[ConsumptionRecordListResponse]:
    if start_at and end_at and start_at > end_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于结束时间")
    return ApiResponse(
        data=get_admin_consumption_records(
            db, page, page_size, user_keyword, service_code, supplier_name, start_at, end_at, order_no
        )
    )


@router.get("/balances", response_model=ApiResponse[AdminBalanceListResponse])
def list_admin_balances(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_keyword: str | None = Query(default=None),
    service_code: str | None = Query(default=None),
    insufficient: bool | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[AdminBalanceListResponse]:
    return ApiResponse(data=get_admin_balance_summaries(db, page, page_size, user_keyword, service_code, insufficient))


@router.get("/wallet-ledger", response_model=ApiResponse[AdminWalletLedgerListResponse])
def list_admin_wallet_ledger_entries(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_keyword: str | None = Query(default=None),
    entry_type: str | None = Query(default=None),
    source_type: str | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[AdminWalletLedgerListResponse]:
    return ApiResponse(
        data=list_admin_wallet_ledger(db, page, page_size, user_keyword, entry_type, source_type)
    )


@router.get("/wallet-recharges", response_model=ApiResponse[AdminWalletRechargeListResponse])
def list_admin_wallet_recharge_orders(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_keyword: str | None = Query(default=None),
    recharge_status: str | None = Query(default=None, alias="status"),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[AdminWalletRechargeListResponse]:
    return ApiResponse(
        data=list_admin_wallet_recharges(db, page, page_size, user_keyword, recharge_status)
    )
