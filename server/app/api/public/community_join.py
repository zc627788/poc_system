from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.community_join import CommunityJoinApplyRequest, CommunityJoinApplyResponse
from app.services.community_join import submit_community_join_application

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/community-join")


@router.post("/apply", response_model=ApiResponse[CommunityJoinApplyResponse])
def apply_community_join(
    payload: CommunityJoinApplyRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[CommunityJoinApplyResponse]:
    logger.info(f"[community-join] apply_community_join called, target_campus={payload.target_campus}")
    try:
        logger.info(f"[community-join] user_id={user_id}")
        result = submit_community_join_application(db, user_id, payload)
        logger.info(f"[community-join] result={result}")
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)
