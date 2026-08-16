from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.trusted_dataspace import (
    AdminTrustedDataspaceRegistrationListResponse,
    AdminTrustedDataspaceRegistrationResponse,
    TrustedDataspaceStatus,
)
from app.services.trusted_dataspace import (
    list_admin_registrations,
    sync_admin_registration,
    sync_pending_admin_registrations,
)
from app.services.trusted_dataspace_errors import (
    TrustedDataspaceConfigurationError,
    TrustedDataspaceConflictError,
    TrustedDataspaceNotFoundError,
    TrustedDataspaceReadTimeoutError,
    TrustedDataspaceUpstreamError,
    TrustedDataspaceValidationError,
)
from app.services.trusted_dataspace_provider import TrustedDataspaceProvider


router = APIRouter(prefix="/trusted-data-space")


def _raise_admin_error(exc: ValueError) -> None:
    if isinstance(exc, TrustedDataspaceNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, TrustedDataspaceConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if isinstance(exc, TrustedDataspaceValidationError):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    if isinstance(exc, TrustedDataspaceConfigurationError):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    if isinstance(exc, (TrustedDataspaceReadTimeoutError, TrustedDataspaceUpstreamError)):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/registrations", response_model=ApiResponse[AdminTrustedDataspaceRegistrationListResponse])
def get_registrations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    keyword: str | None = Query(default=None),
    registration_status: TrustedDataspaceStatus | None = Query(default=None, alias="status"),
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[AdminTrustedDataspaceRegistrationListResponse]:
    if start_at and end_at and start_at > end_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于结束时间")
    sync_warning = None
    try:
        provider = TrustedDataspaceProvider.from_settings()
        sync_pending_admin_registrations(db, provider)
    except (
        TrustedDataspaceValidationError,
        TrustedDataspaceConflictError,
        TrustedDataspaceConfigurationError,
        TrustedDataspaceReadTimeoutError,
        TrustedDataspaceUpstreamError,
    ):
        db.rollback()
        sync_warning = "最新审核状态同步失败，当前展示上次成功同步结果"
    try:
        result = list_admin_registrations(
            db,
            page,
            page_size,
            keyword,
            registration_status.value if registration_status else None,
            start_at,
            end_at,
        )
    except TrustedDataspaceConfigurationError as exc:
        _raise_admin_error(exc)
    result.sync_warning = sync_warning
    return ApiResponse(data=result)


@router.post(
    "/registrations/{registration_id}/sync",
    response_model=ApiResponse[AdminTrustedDataspaceRegistrationResponse],
)
def sync_registration_status(
    registration_id: int,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[AdminTrustedDataspaceRegistrationResponse]:
    try:
        provider = TrustedDataspaceProvider.from_settings()
        result = sync_admin_registration(db, registration_id, provider)
    except (
        TrustedDataspaceValidationError,
        TrustedDataspaceConflictError,
        TrustedDataspaceNotFoundError,
        TrustedDataspaceConfigurationError,
        TrustedDataspaceReadTimeoutError,
        TrustedDataspaceUpstreamError,
    ) as exc:
        _raise_admin_error(exc)
    return ApiResponse(data=result)
