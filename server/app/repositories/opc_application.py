from collections.abc import Sequence
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.opc_application import OpcApplication
from app.models.site_user import SiteUser


def create_opc_application(db: Session, application: OpcApplication) -> OpcApplication:
    db.add(application)
    db.flush()
    return application


def get_opc_application_by_id(db: Session, application_id: int) -> OpcApplication | None:
    return db.query(OpcApplication).filter(OpcApplication.id == application_id).first()


def get_opc_application_by_no(db: Session, application_no: str) -> OpcApplication | None:
    return db.query(OpcApplication).filter(OpcApplication.application_no == application_no).first()


def list_opc_applications_by_site_user(
    db: Session,
    site_user_id: int,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[OpcApplication], int]:
    query = db.query(OpcApplication).filter(OpcApplication.site_user_id == site_user_id)
    total = query.count()
    items = (
        query.order_by(OpcApplication.created_at.desc(), OpcApplication.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_admin_opc_applications(
    db: Session,
    submitter_keyword: str | None = None,
    status: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[OpcApplication], int]:
    query = db.query(OpcApplication).outerjoin(SiteUser, SiteUser.id == OpcApplication.site_user_id)
    if submitter_keyword:
        like_value = f"%{submitter_keyword.strip()}%"
        query = query.filter((SiteUser.name.like(like_value)) | (SiteUser.phone.like(like_value)))
    if status:
        query = query.filter(OpcApplication.status == status)
    if start_time:
        query = query.filter(OpcApplication.submitted_at >= start_time)
    if end_time:
        query = query.filter(OpcApplication.submitted_at <= end_time)
    total = query.count()
    items = (
        query.order_by(OpcApplication.submitted_at.desc(), OpcApplication.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def list_opc_applications_by_ids(db: Session, application_ids: Sequence[int]) -> list[OpcApplication]:
    if not application_ids:
        return []
    return db.query(OpcApplication).filter(OpcApplication.id.in_(application_ids)).all()


def update_opc_application(db: Session, application: OpcApplication) -> OpcApplication:
    db.add(application)
    db.flush()
    return application
