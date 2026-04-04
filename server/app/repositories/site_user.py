from sqlalchemy.orm import Session

from app.models.site_user import SiteUser


def get_site_user_by_phone(db: Session, phone: str) -> SiteUser | None:
    return db.query(SiteUser).filter(SiteUser.phone == phone).first()


def get_site_user_by_id(db: Session, user_id: int) -> SiteUser | None:
    return db.query(SiteUser).filter(SiteUser.id == user_id).first()
