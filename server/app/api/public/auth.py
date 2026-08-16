import logging

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import decode_access_token
from app.schemas.auth import SiteUserAuthData, SiteUserLoginRequest, SiteUserProfile, SiteUserRegisterRequest, SiteUserTestBridgeRequest
from app.schemas.common import ApiResponse
from app.services.auth import bridge_test_site_user_auth, get_or_create_test_site_user_auth, get_site_user_profile_by_id, login_site_user, register_site_user
from app.services.ixiamen_sso import (
    build_frontend_login_redirect,
    build_ixiamen_authorize_url,
    build_ixiamen_logout_url,
    decode_ixiamen_state,
    login_site_user_with_ixiamen_code,
)


router = APIRouter()


_auth_logger = logging.getLogger("site_user_auth")


def require_site_user_auth(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        _auth_logger.warning("[auth] missing authorization header")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization")

    token = authorization.split(" ", 1)[1].strip()
    _auth_logger.warning("[auth] bearer token received len=%d", len(token))
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        _auth_logger.warning("[auth] decode failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    _auth_logger.warning("[auth] decoded payload role=%s sub=%s", payload.get("role"), payload.get("sub"))
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


@router.post("/dev-login", response_model=ApiResponse[SiteUserAuthData])
def dev_login(db: Session = Depends(get_db)) -> ApiResponse[SiteUserAuthData]:
    return ApiResponse(data=get_or_create_test_site_user_auth(db))


@router.post("/test-bridge", response_model=ApiResponse[SiteUserAuthData])
def test_bridge_login(payload: SiteUserTestBridgeRequest, db: Session = Depends(get_db)) -> ApiResponse[SiteUserAuthData]:
    if not settings.allow_test_auth_bridge:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="test bridge disabled")
    if (payload.auth_source or "").strip().lower() != "ixiamen":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="test bridge only supports ixiamen users")
    try:
        result = bridge_test_site_user_auth(db, payload.id, payload.phone, payload.auth_source)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)


@router.get("/ixiamen/start")
def start_ixiamen_login(
    return_to: str | None = Query(default=None),
    user_agent: str | None = Header(default=None),
) -> RedirectResponse:
    try:
        login_url = build_ixiamen_authorize_url(return_to, user_agent=user_agent)
    except ValueError as exc:
        return RedirectResponse(
            url=build_frontend_login_redirect(return_to or "/", error_message=str(exc)),
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )
    return RedirectResponse(url=login_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


logger = logging.getLogger(__name__)


@router.get("/ixiamen/callback")
def handle_ixiamen_callback(
    request: Request,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    logger.warning("[ixiamen callback] url=%s code=%s state=%s error=%s", str(request.url), code, state[:20] if state else None, error)
    try:
        return_to = decode_ixiamen_state(state)
    except ValueError as exc:
        return RedirectResponse(
            url=build_frontend_login_redirect("/", error_message=str(exc)),
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    if error:
        return RedirectResponse(
            url=build_frontend_login_redirect(return_to, error_message=error),
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    if not code:
        return RedirectResponse(
            url=build_frontend_login_redirect(return_to, error_message="i厦门未返回授权码"),
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    try:
        result = login_site_user_with_ixiamen_code(db, code)
    except ValueError as exc:
        return RedirectResponse(
            url=build_frontend_login_redirect(return_to, error_message=str(exc)),
            status_code=status.HTTP_307_TEMPORARY_REDIRECT,
        )

    return RedirectResponse(
        url=build_frontend_login_redirect(return_to, token=result.access_token),
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )


@router.get("/ixiamen/logout")
def handle_ixiamen_logout(user_agent: str | None = Header(default=None)) -> RedirectResponse:
    try:
        logout_url = build_ixiamen_logout_url(user_agent=user_agent)
    except ValueError:
        logout_url = build_frontend_login_redirect("/", error_message="i厦门单点登录未配置完成")
    return RedirectResponse(url=logout_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
