from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.features.application_form.persistence.application_service import (
    clear_application_form_draft,
    get_application_form_draft,
    save_application_form_draft,
)
from app.features.application_form.schemas.submit_request import (
    ApplicationFormDraftClearResponse,
    ApplicationFormDraftResponse,
    ApplicationFormDraftSaveResponse,
    ApplicationFormSubmitRequest,
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/application-form")


@router.get("/draft", response_model=ApiResponse[ApplicationFormDraftResponse])
def get_draft(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[ApplicationFormDraftResponse]:
    return ApiResponse(data=get_application_form_draft(db, user_id))


@router.post("/draft", response_model=ApiResponse[ApplicationFormDraftSaveResponse])
def save_draft(
    payload: ApplicationFormSubmitRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[ApplicationFormDraftSaveResponse]:
    try:
        result = save_application_form_draft(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)


@router.post("/draft/clear", response_model=ApiResponse[ApplicationFormDraftClearResponse])
def clear_draft(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[ApplicationFormDraftClearResponse]:
    return ApiResponse(data=clear_application_form_draft(db, user_id))
