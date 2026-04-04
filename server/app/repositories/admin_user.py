from sqlalchemy.orm import Session

from app.models.admin_user import AdminUser


def get_admin_user_by_username(db: Session, username: str) -> AdminUser | None:
    return db.query(AdminUser).filter(AdminUser.username == username).first()

