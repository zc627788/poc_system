from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.repositories.admin_user import get_admin_user_by_username


class AdminAuthContext(BaseModel):
    user_id: int
    username: str
    name: str
    can_delete_materials: bool


ADMIN_DELETE_USERNAMES = {"admin"}
ADMIN_DELETE_NAMES = {"管理员", "超级管理员", "系统管理员"}


def require_admin_auth_context(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AdminAuthContext:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid admin token")

    username = str(payload.get("sub") or "").strip()
    user_id = int(payload.get("uid") or 0)
    if not username or user_id <= 0:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid access token")

    admin_user = get_admin_user_by_username(db, username)
    if admin_user is None or admin_user.id != user_id or admin_user.status != 1:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="admin user not found")

    return AdminAuthContext(
        user_id=admin_user.id,
        username=admin_user.username,
        name=admin_user.name,
        can_delete_materials=admin_user.username in ADMIN_DELETE_USERNAMES or admin_user.name in ADMIN_DELETE_NAMES,
    )
