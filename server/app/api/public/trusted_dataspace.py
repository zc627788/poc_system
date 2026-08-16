from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.trusted_dataspace import TrustedDataspaceRegistrationResponse, TrustedDataspaceRegistrationSubmitRequest
from app.services.trusted_dataspace import get_registration, submit_registration, sync_registration
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


def _raise_trusted_dataspace_error(exc: ValueError) -> None:
    if isinstance(exc, TrustedDataspaceNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, TrustedDataspaceConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if isinstance(exc, TrustedDataspaceValidationError):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    if isinstance(exc, TrustedDataspaceConfigurationError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="注册服务暂时不可用，请稍后再试",
        ) from exc
    if isinstance(exc, (TrustedDataspaceReadTimeoutError, TrustedDataspaceUpstreamError)):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/registration", response_model=ApiResponse[TrustedDataspaceRegistrationResponse | None])
def get_my_registration(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[TrustedDataspaceRegistrationResponse | None]:
    try:
        result = get_registration(db, user_id)
    except TrustedDataspaceConfigurationError as exc:
        _raise_trusted_dataspace_error(exc)
    return ApiResponse(data=result)


@router.post("/registration/submit", response_model=ApiResponse[TrustedDataspaceRegistrationResponse])
def submit_my_registration(
    payload: TrustedDataspaceRegistrationSubmitRequest,
    idempotency_key: str = Header(alias="Idempotency-Key"),
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[TrustedDataspaceRegistrationResponse]:
    try:
        provider = TrustedDataspaceProvider.from_settings()
        result = submit_registration(db, user_id, idempotency_key, payload, provider)
    except (
        TrustedDataspaceValidationError,
        TrustedDataspaceConflictError,
        TrustedDataspaceConfigurationError,
        TrustedDataspaceReadTimeoutError,
        TrustedDataspaceUpstreamError,
    ) as exc:
        _raise_trusted_dataspace_error(exc)
    return ApiResponse(data=result)


@router.post("/registration/sync", response_model=ApiResponse[TrustedDataspaceRegistrationResponse])
def sync_my_registration(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[TrustedDataspaceRegistrationResponse]:
    try:
        provider = TrustedDataspaceProvider.from_settings()
        result = sync_registration(db, user_id, provider)
    except (
        TrustedDataspaceValidationError,
        TrustedDataspaceConflictError,
        TrustedDataspaceNotFoundError,
        TrustedDataspaceConfigurationError,
        TrustedDataspaceReadTimeoutError,
        TrustedDataspaceUpstreamError,
    ) as exc:
        _raise_trusted_dataspace_error(exc)
    return ApiResponse(data=result)
