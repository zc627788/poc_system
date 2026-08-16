from datetime import datetime

from sqlalchemy.orm import Session

from app.models.community_join_action_log import CommunityJoinActionLog
from app.models.community_join_application import CommunityJoinApplication
from app.models.community_join_material_file import CommunityJoinMaterialFile


def create_community_join_application(db: Session, item: CommunityJoinApplication) -> CommunityJoinApplication:
    db.add(item)
    db.flush()
    return item


def get_community_join_application_by_id(db: Session, application_id: int) -> CommunityJoinApplication | None:
    return db.query(CommunityJoinApplication).filter(CommunityJoinApplication.id == application_id).first()


def get_community_join_application_by_user_campus(
    db: Session, site_user_id: int, target_campus: str
) -> CommunityJoinApplication | None:
    return (
        db.query(CommunityJoinApplication)
        .filter(
            CommunityJoinApplication.site_user_id == site_user_id,
            CommunityJoinApplication.target_campus == target_campus,
        )
        .first()
    )


def get_community_join_application_by_user(db: Session, site_user_id: int) -> CommunityJoinApplication | None:
    return (
        db.query(CommunityJoinApplication)
        .filter(CommunityJoinApplication.site_user_id == site_user_id)
        .first()
    )


def list_community_join_applications(
    db: Session,
    submitter_keyword: str | None = None,
    status: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    target_campus: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[CommunityJoinApplication], int]:
    query = db.query(CommunityJoinApplication)

    if submitter_keyword:
        kw = f"%{submitter_keyword}%"
        query = query.filter(
            CommunityJoinApplication.site_user_name.like(kw)
            | CommunityJoinApplication.site_user_phone.like(kw)
        )
    if status:
        query = query.filter(CommunityJoinApplication.status == status)
    if target_campus:
        query = query.filter(CommunityJoinApplication.target_campus == target_campus)
    if start_time:
        query = query.filter(CommunityJoinApplication.submitted_at >= start_time)
    if end_time:
        query = query.filter(CommunityJoinApplication.submitted_at <= end_time)

    total = query.count()
    items = query.order_by(CommunityJoinApplication.submitted_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def update_community_join_application(db: Session, item: CommunityJoinApplication) -> CommunityJoinApplication:
    db.add(item)
    db.flush()
    return item


def create_community_join_material_file(db: Session, item: CommunityJoinMaterialFile) -> CommunityJoinMaterialFile:
    db.add(item)
    db.flush()
    return item


def get_community_join_material_file_by_id(db: Session, file_id: int) -> CommunityJoinMaterialFile | None:
    return db.query(CommunityJoinMaterialFile).filter(CommunityJoinMaterialFile.id == file_id).first()


def list_community_join_material_files(db: Session, application_id: int) -> list[CommunityJoinMaterialFile]:
    return (
        db.query(CommunityJoinMaterialFile)
        .filter(
            CommunityJoinMaterialFile.application_id == application_id,
            CommunityJoinMaterialFile.is_deleted == 0,
        )
        .order_by(CommunityJoinMaterialFile.uploaded_at.asc())
        .all()
    )


def create_community_join_action_log(db: Session, item: CommunityJoinActionLog) -> CommunityJoinActionLog:
    db.add(item)
    db.flush()
    return item


def list_community_join_action_logs(db: Session, application_id: int) -> list[CommunityJoinActionLog]:
    return (
        db.query(CommunityJoinActionLog)
        .filter(CommunityJoinActionLog.application_id == application_id)
        .order_by(CommunityJoinActionLog.operated_at.asc())
        .all()
    )
