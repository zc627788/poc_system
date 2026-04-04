import re
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.site_user import SiteUser
from app.repositories.admin_user import get_admin_user_by_username
from app.repositories.site_user import get_site_user_by_id, get_site_user_by_phone
from app.schemas.auth import LoginData, LoginUser, SiteUserAuthData, SiteUserProfile


PHONE_PATTERN = re.compile(r"^1[3-9]\d{9}$")
PASSWORD_PATTERN = re.compile(r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d~!@#$%^&*()_+\-=\[\]{}|;:'\",.<>/?]{8,20}$")


def validate_phone(phone: str) -> str:
    normalized = phone.strip()
    if not PHONE_PATTERN.fullmatch(normalized):
        raise ValueError("invalid phone number")
    return normalized


def validate_site_user_name(name: str) -> str:
    normalized = name.strip()
    if len(normalized) < 2 or len(normalized) > 20:
        raise ValueError("name length must be between 2 and 20")
    return normalized


def validate_password(password: str) -> str:
    normalized = password.strip()
    if not PASSWORD_PATTERN.fullmatch(normalized):
        raise ValueError("password must be 8-20 chars and include letters and numbers")
    return normalized


def login_admin_user(db: Session, username: str, password: str) -> LoginData | None:
    user = get_admin_user_by_username(db, username)
    if user is None or user.status != 1:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return LoginData(
        access_token=create_access_token(subject=user.username, extra_claims={"role": "admin", "uid": user.id}),
        user=LoginUser(id=user.id, username=user.username, name=user.name),
    )


def register_site_user(db: Session, name: str, phone: str, password: str) -> SiteUserAuthData:
    normalized_name = validate_site_user_name(name)
    normalized_phone = validate_phone(phone)
    normalized_password = validate_password(password)

    existing = get_site_user_by_phone(db, normalized_phone)
    if existing is not None:
        raise ValueError("phone already registered")

    item = SiteUser(
        name=normalized_name,
        phone=normalized_phone,
        password_hash=get_password_hash(normalized_password),
        status=1,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _build_site_user_auth_data(item)


def login_site_user(db: Session, phone: str, password: str) -> SiteUserAuthData | None:
    normalized_phone = validate_phone(phone)
    user = get_site_user_by_phone(db, normalized_phone)
    if user is None or user.status != 1:
        return None

    if not verify_password(password, user.password_hash):
        return None

    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return _build_site_user_auth_data(user)


def get_site_user_profile_by_id(db: Session, user_id: int) -> SiteUserProfile | None:
    user = get_site_user_by_id(db, user_id)
    if user is None:
        return None
    return _build_site_user_profile(user)


def _build_site_user_auth_data(user: SiteUser) -> SiteUserAuthData:
    return SiteUserAuthData(
        access_token=create_access_token(
            subject=str(user.id),
            extra_claims={"role": "site_user", "phone": user.phone, "name": user.name},
        ),
        user=_build_site_user_profile(user),
    )


def _build_site_user_profile(user: SiteUser) -> SiteUserProfile:
    return SiteUserProfile(
        id=user.id,
        name=user.name,
        phone=user.phone,
        status=user.status,
        created_at=user.created_at.isoformat(),
        last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
    )
