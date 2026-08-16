from __future__ import annotations

import json
import logging
import secrets
from datetime import datetime
from urllib import error, parse, request

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token, get_password_hash
from app.models.site_user import SiteUser
from app.repositories.site_user import get_site_user_by_external_open_id, get_site_user_by_phone
from app.schemas.auth import SiteUserAuthData
from app.services.auth import validate_phone


logger = logging.getLogger(__name__)

STATE_ROLE = "ixiamen_sso_state"
STATE_TTL_SECONDS = 600


def ensure_ixiamen_sso_enabled() -> None:
    if not settings.has_ixiamen_sso_config:
        raise ValueError("i厦门单点登录未配置完成")


def build_ixiamen_authorize_url(return_to: str | None = None, user_agent: str | None = None) -> str:
    ensure_ixiamen_sso_enabled()
    normalized_return_to = normalize_return_to(return_to)
    state = create_access_token(
        subject=normalized_return_to,
        expires_in_seconds=STATE_TTL_SECONDS,
        extra_claims={"role": STATE_ROLE},
    )
    params = parse.urlencode(
        {
            "client_id": settings.ixiamen_client_id,
            "redirect_uri": settings.ixiamen_redirect_uri,
            "response_type": "code",
            "scope": settings.ixiamen_scope,
            "channel": _detect_ixiamen_channel(user_agent),
            "state": state,
        },
        quote_via=parse.quote,
    )
    return f"{_ixiamen_api_base_uri()}/oauth/authorize?{params}"


def decode_ixiamen_state(state: str | None) -> str:
    if not state:
        return normalize_return_to(None)

    try:
        payload = decode_access_token(state)
    except ValueError as exc:
        raise ValueError("i厦门登录状态已失效，请重新发起登录") from exc

    if payload.get("role") != STATE_ROLE:
        raise ValueError("i厦门登录状态不合法，请重新发起登录")

    return normalize_return_to(str(payload.get("sub") or "/"))


def login_site_user_with_ixiamen_code(db: Session, code: str) -> SiteUserAuthData:
    ensure_ixiamen_sso_enabled()
    token_payload = exchange_ixiamen_code_for_token(code)
    access_token = str(token_payload.get("access_token") or "").strip()
    if not access_token:
        raise ValueError("i厦门未返回 access_token")

    profile = fetch_ixiamen_user_profile(access_token)
    user = upsert_site_user_from_ixiamen_profile(db, profile)
    return build_site_user_auth_data(user)


def build_ixiamen_logout_url(user_agent: str | None = None) -> str:
    ensure_ixiamen_sso_enabled()
    redirect_uri = settings.ixiamen_logout_redirect_uri or settings.normalized_site_public_url
    params = parse.urlencode(
        {
            "channel": _detect_ixiamen_channel(user_agent),
            "redirectUri": redirect_uri,
        },
        quote_via=parse.quote,
    )
    return f"{_ixiamen_web_base_uri()}/#/logout?{params}"


def build_frontend_login_redirect(return_to: str, token: str | None = None, error_message: str | None = None) -> str:
    query = parse.urlencode(
        {
            "mode": "callback",
            "return_to": normalize_return_to(return_to),
            **({"error": error_message} if error_message else {}),
        },
        quote_via=parse.quote,
    )
    fragment = parse.urlencode({"token": token}, quote_via=parse.quote) if token else ""
    url = f"{settings.normalized_site_public_url}/login?{query}"
    if fragment:
        url = f"{url}#{fragment}"
    return url


def normalize_return_to(return_to: str | None) -> str:
    value = (return_to or "").strip()
    if not value:
        return _normalize_post_login_redirect()

    if value.startswith(("http://", "https://", "//")):
        return _normalize_post_login_redirect()

    if not value.startswith("/"):
        return _normalize_post_login_redirect()

    return value


def exchange_ixiamen_code_for_token(code: str) -> dict:
    form_data = parse.urlencode(
        {
            "grant_type": "authorization_code",
            "scope": settings.ixiamen_scope,
            "client_id": settings.ixiamen_client_id,
            "client_secret": settings.ixiamen_client_secret,
            "code": code,
            "redirect_uri": settings.ixiamen_redirect_uri,
        },
        quote_via=parse.quote,
    ).encode("utf-8")

    return _request_json(
        f"{_ixiamen_api_base_uri()}/oauth/token",
        method="POST",
        data=form_data,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )


def fetch_ixiamen_user_profile(access_token: str) -> dict:
    return _request_json(
        f"{_ixiamen_api_base_uri()}/server/public/user/get",
        method="POST",
        data=b"{}",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )


def upsert_site_user_from_ixiamen_profile(db: Session, profile: dict) -> SiteUser:
    open_id = str(profile.get("openId") or "").strip()
    if not open_id:
        raise ValueError("i厦门用户信息缺少 openId")

    phone = str(profile.get("mobile") or "").strip()
    if not phone:
        raise ValueError("i厦门用户信息缺少手机号，请确认授权范围包含 mobile")
    phone = validate_phone(phone)

    display_name = _build_display_name(profile, open_id)
    external_user_id = _extract_external_user_id(profile)

    user = get_site_user_by_external_open_id(db, open_id)
    if user is None:
        user = get_site_user_by_phone(db, phone)

    if user is None:
        user = SiteUser(
            name=display_name,
            real_name=str(profile.get("personName") or "").strip() or None,
            phone=phone,
            password_hash=get_password_hash(secrets.token_urlsafe(24)),
            status=1,
            auth_source="ixiamen",
            external_open_id=open_id,
            external_user_id=external_user_id,
            user_type=_safe_int(profile.get("userType")),
            mobile_fuzzy=str(profile.get("mobileFuzzy") or "").strip() or None,
            raw_profile_json=json.dumps(profile, ensure_ascii=False),
            last_login_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    if user.status != 1:
        raise ValueError("当前用户已被停用，请联系管理员")

    user.name = display_name
    user.real_name = str(profile.get("personName") or "").strip() or user.real_name
    user.phone = phone
    user.auth_source = "ixiamen"
    user.external_open_id = open_id
    user.external_user_id = external_user_id or user.external_user_id
    user.user_type = _safe_int(profile.get("userType"))
    user.mobile_fuzzy = str(profile.get("mobileFuzzy") or "").strip() or None
    user.raw_profile_json = json.dumps(profile, ensure_ascii=False)
    user.last_login_at = datetime.utcnow()
    if not user.password_hash:
        user.password_hash = get_password_hash(secrets.token_urlsafe(24))

    db.commit()
    db.refresh(user)
    return user


def build_site_user_auth_data(user: SiteUser) -> SiteUserAuthData:
    from app.services.auth import _build_site_user_auth_data

    return _build_site_user_auth_data(user)


def _request_json(url: str, method: str, headers: dict[str, str], data: bytes | None = None) -> dict:
    request_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/148.0.0.0 Safari/537.36"
        ),
        **headers,
    }
    logger.warning("[ixiamen request] %s %s data=%s", method, url, _mask_ixiamen_secret(data[:200] if data else None))
    req = request.Request(url=url, data=data, headers=request_headers, method=method)
    try:
        with request.urlopen(req, timeout=15) as response:
            body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        message = exc.read().decode("utf-8", errors="ignore")
        logger.warning("[ixiamen error] status=%s body=%s", exc.code, message[:500])
        raise ValueError(_extract_error_message(message) or "i厦门接口请求失败") from exc
    except error.URLError as exc:
        logger.warning("[ixiamen error] URLError=%s", str(exc))
        raise ValueError("无法连接 i厦门认证服务，请稍后重试") from exc

    logger.warning("[ixiamen response] body=%s", body[:500])
    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise ValueError("i厦门接口返回了无法解析的数据") from exc


def _build_display_name(profile: dict, open_id: str) -> str:
    name = str(profile.get("personName") or "").strip()
    if not name:
        name = str(profile.get("personNameFuzzy") or "").strip()
    if not name:
        name = f"i厦门用户{open_id[-4:]}"
    return name[:64]


def _extract_external_user_id(profile: dict) -> str | None:
    external_users = profile.get("externalUsers")
    if not isinstance(external_users, list):
        return None

    for item in external_users:
        if not isinstance(item, dict):
            continue
        external_user_id = str(item.get("externalUserId") or "").strip()
        if external_user_id:
            return external_user_id[:128]
    return None


def _extract_error_message(raw_message: str) -> str | None:
    if not raw_message:
        return None
    try:
        payload = json.loads(raw_message)
    except json.JSONDecodeError:
        return raw_message[:200]

    if isinstance(payload, dict):
        for key in ("error_description", "error", "message", "detail"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return raw_message[:200]


def _mask_ixiamen_secret(value: bytes | str | None) -> bytes | str | None:
    if value is None or not settings.ixiamen_client_secret:
        return value
    if isinstance(value, bytes):
        return value.replace(settings.ixiamen_client_secret.encode("utf-8"), b"******")
    return value.replace(settings.ixiamen_client_secret, "******")


def _detect_ixiamen_channel(user_agent: str | None) -> str:
    if not user_agent:
        return settings.ixiamen_channel

    ua = user_agent.lower()
    # 匹配移动端常用标识
    mobile_keywords = (
        "mobile",
        "android",
        "iphone",
        "ipad",
        "phone",
        "micromessenger",  # 微信环境
    )
    if any(keyword in ua for keyword in mobile_keywords):
        return settings.ixiamen_channel_mobile

    return settings.ixiamen_channel


def _normalize_post_login_redirect() -> str:
    value = (settings.ixiamen_post_login_redirect or "/").strip()
    if not value.startswith("/") or value.startswith("//"):
        return "/"
    return value


def _ixiamen_api_base_uri() -> str:
    base_uri = settings.normalized_ixiamen_base_uri
    for suffix in ("/web/#", "/web", "/#"):
        if base_uri.endswith(suffix):
            return base_uri[: -len(suffix)].rstrip("/")
    return base_uri.rstrip("/")


def _ixiamen_web_base_uri() -> str:
    return f"{_ixiamen_api_base_uri()}/web"


def _safe_int(value: object) -> int | None:
    try:
        if value is None or value == "":
            return None
        return int(value)
    except (TypeError, ValueError):
        return None
