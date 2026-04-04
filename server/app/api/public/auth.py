from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.schemas.auth import SiteUserAuthData, SiteUserLoginRequest, SiteUserProfile, SiteUserRegisterRequest
from app.schemas.common import ApiResponse
from app.services.auth import get_site_user_profile_by_id, login_site_user, register_site_user


router = APIRouter()


def require_site_user_auth(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("role") != "site_user":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid user token")

    subject = payload.get("sub")
    if not subject or not str(subject).isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid access token")
    return int(subject)


@router.post("/register", response_model=ApiResponse[SiteUserAuthData])
def register(payload: SiteUserRegisterRequest, db: Session = Depends(get_db)) -> ApiResponse[SiteUserAuthData]:
    try:
        result = register_site_user(db, payload.name, payload.phone, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)


@router.post("/login", response_model=ApiResponse[SiteUserAuthData])
def login(payload: SiteUserLoginRequest, db: Session = Depends(get_db)) -> ApiResponse[SiteUserAuthData]:
    try:
        result = login_site_user(db, payload.phone, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid phone or password")
    return ApiResponse(data=result)


@router.get("/me", response_model=ApiResponse[SiteUserProfile])
def me(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[SiteUserProfile]:
    profile = get_site_user_profile_by_id(db, user_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    return ApiResponse(data=profile)
