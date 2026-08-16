from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.features.application_form.persistence.application_service import submit_application_form
from app.features.application_form.schemas.submit_request import ApplicationFormSubmitRequest, ApplicationFormSubmitResponse
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/application-form")


@router.post("/submit", response_model=ApiResponse[ApplicationFormSubmitResponse])
def submit(
    payload: ApplicationFormSubmitRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[ApplicationFormSubmitResponse]:
    try:
        result = submit_application_form(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)
