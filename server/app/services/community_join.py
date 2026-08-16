from datetime import datetime
from pathlib import Path
import logging

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.models.community_join_action_log import CommunityJoinActionLog
from app.models.community_join_application import CommunityJoinApplication
from app.models.community_join_material_file import CommunityJoinMaterialFile
from app.repositories.community_join import (
    create_community_join_action_log,
    create_community_join_application,
    create_community_join_material_file,
    get_community_join_application_by_id,
    get_community_join_application_by_user,
    get_community_join_application_by_user_campus,
    get_community_join_material_file_by_id,
    list_community_join_action_logs,
    list_community_join_applications,
    list_community_join_material_files,
    update_community_join_application,
)
from app.repositories.site_user import get_site_user_by_id
from app.schemas.community_join import (
    CommunityJoinActionLogItem,
    CommunityJoinApplyRequest,
    CommunityJoinApplyResponse,
    CommunityJoinApplicationDetailResponse,
    CommunityJoinApplicationListItem,
    CommunityJoinApplicationListResponse,
    CommunityJoinMaterialFileItem,
)
from app.services.opc_upload_storage import resolve_storage_path

VALID_CAMPUSES = {"园区二", "园区三"}


def _to_material_item(f: CommunityJoinMaterialFile) -> CommunityJoinMaterialFileItem:
    return CommunityJoinMaterialFileItem(
        id=f.id,
        application_id=f.application_id,
        original_file_name=f.original_file_name,
        storage_path=f.storage_path,
        file_type=f.file_type,
        file_size=f.file_size,
        is_deleted=bool(f.is_deleted),
        uploaded_at=f.uploaded_at.isoformat(),
    )


def _to_action_log_item(log: CommunityJoinActionLog) -> CommunityJoinActionLogItem:
    return CommunityJoinActionLogItem(
        id=log.id,
        action_type=log.action_type,
        action_summary=log.action_summary,
        action_detail=log.action_detail,
        operated_by_name=log.operated_by_name,
        operated_at=log.operated_at.isoformat(),
    )


def _to_list_item(db: Session, app: CommunityJoinApplication) -> CommunityJoinApplicationListItem:
    material_count = len(list_community_join_material_files(db, app.id))
    return CommunityJoinApplicationListItem(
        id=app.id,
        site_user_id=app.site_user_id,
        site_user_name=app.site_user_name,
        site_user_phone=app.site_user_phone,
        target_campus=app.target_campus,
        status=app.status,
        material_count=material_count,
        submitted_at=app.submitted_at.isoformat(),
        updated_at=app.updated_at.isoformat(),
    )


def _to_detail(db: Session, app: CommunityJoinApplication) -> CommunityJoinApplicationDetailResponse:
    materials = [_to_material_item(f) for f in list_community_join_material_files(db, app.id)]
    logs = [_to_action_log_item(log) for log in list_community_join_action_logs(db, app.id)]
    return CommunityJoinApplicationDetailResponse(
        id=app.id,
        site_user_id=app.site_user_id,
        site_user_name=app.site_user_name,
        site_user_phone=app.site_user_phone,
        target_campus=app.target_campus,
        status=app.status,
        submitted_at=app.submitted_at.isoformat(),
        updated_at=app.updated_at.isoformat(),
        materials=materials,
        action_logs=logs,
    )


def submit_community_join_application(
    db: Session, site_user_id: int, payload: CommunityJoinApplyRequest
) -> CommunityJoinApplyResponse:
    target_campus = payload.target_campus.strip()
    logger.info(f"[community-join] submit_application: site_user_id={site_user_id}, target_campus='{target_campus}'")
    if not target_campus:
        raise ValueError("请选择申请园区")

    # 标准化 target_campus：去除所有空格
    normalized_campus = "".join(target_campus.split())
    logger.info(f"[community-join] normalized_campus='{normalized_campus}'")

    # 查询该用户的所有申请，标准化后比较
    all_user_apps = list_community_join_applications(db, submitter_keyword=None, status=None, start_time=None, end_time=None, target_campus=None, page=1, page_size=1000)
    all_user_apps = [app for app in all_user_apps[0] if app.site_user_id == site_user_id]

    for app in all_user_apps:
        app_normalized = "".join(app.target_campus.split())
        logger.info(f"[community-join] comparing '{normalized_campus}' with existing '{app_normalized}'")
        if normalized_campus == app_normalized:
            logger.info(f"[community-join] duplicate found: id={app.id}, status={app.status}")
            raise ValueError("您已提交过该园区的入驻申请，请勿重复申请。")

    user = get_site_user_by_id(db, site_user_id)
    now = datetime.utcnow()
    app = CommunityJoinApplication(
        site_user_id=site_user_id,
        site_user_name=user.name if user else None,
        site_user_phone=user.phone if user else None,
        target_campus=payload.target_campus,
        status="未上传",
        submitted_at=now,
        created_at=now,
        updated_at=now,
    )
    create_community_join_application(db, app)
    create_community_join_action_log(
        db,
        CommunityJoinActionLog(
            application_id=app.id,
            action_type="submit",
            action_summary=f"用户申请入驻{payload.target_campus}",
            operated_by_site_user_id=site_user_id,
            operated_by_name=app.site_user_name,
            operated_at=now,
            created_at=now,
        ),
    )
    db.commit()
    return CommunityJoinApplyResponse(
        id=app.id,
        target_campus=app.target_campus,
        status=app.status,
        submitted_at=app.submitted_at.isoformat(),
    )


def list_community_join_summaries(
    db: Session,
    submitter_keyword: str | None = None,
    status: str | None = None,
    target_campus: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    page: int = 1,
    page_size: int = 10,
) -> CommunityJoinApplicationListResponse:
    items, total = list_community_join_applications(
        db, submitter_keyword, status, start_time, end_time, target_campus, page, page_size
    )
    return CommunityJoinApplicationListResponse(
        items=[_to_list_item(db, app) for app in items],
        total=total,
        page=page,
        page_size=page_size,
    )


def get_community_join_detail(db: Session, application_id: int) -> CommunityJoinApplicationDetailResponse:
    app = get_community_join_application_by_id(db, application_id)
    if app is None:
        raise ValueError("申请记录不存在")
    return _to_detail(db, app)


def add_community_join_material(
    db: Session,
    application_id: int,
    admin_user_id: int,
    admin_name: str,
    original_file_name: str,
    storage_path: str,
    file_type: str,
    file_size: int,
) -> CommunityJoinMaterialFileItem:
    app = get_community_join_application_by_id(db, application_id)
    if app is None:
        raise ValueError("申请记录不存在")

    now = datetime.utcnow()
    file_item = CommunityJoinMaterialFile(
        application_id=application_id,
        original_file_name=original_file_name,
        storage_path=storage_path,
        file_type=file_type,
        file_size=file_size,
        is_deleted=0,
        uploaded_by_admin_user_id=admin_user_id,
        uploaded_at=now,
        created_at=now,
        updated_at=now,
    )
    create_community_join_material_file(db, file_item)

    if app.status == "未上传":
        app.status = "已上传"
        app.updated_at = now
        update_community_join_application(db, app)

    create_community_join_action_log(
        db,
        CommunityJoinActionLog(
            application_id=application_id,
            material_file_id=file_item.id,
            action_type="material_upload",
            action_summary="后台上传材料",
            action_detail=original_file_name,
            operated_by_admin_user_id=admin_user_id,
            operated_by_name=admin_name,
            operated_at=now,
            created_at=now,
        ),
    )
    db.commit()
    return _to_material_item(file_item)


def delete_community_join_material(
    db: Session,
    application_id: int,
    file_id: int,
    admin_user_id: int,
    admin_name: str,
) -> str:
    file_item = get_community_join_material_file_by_id(db, file_id)
    if file_item is None or file_item.application_id != application_id or file_item.is_deleted:
        raise ValueError("材料文件不存在")

    now = datetime.utcnow()
    file_item.is_deleted = 1
    file_item.deleted_by_admin_user_id = admin_user_id
    file_item.deleted_at = now
    file_item.updated_at = now
    db.add(file_item)

    app = get_community_join_application_by_id(db, application_id)
    if app is not None:
        remaining = list_community_join_material_files(db, application_id)
        remaining = [f for f in remaining if f.id != file_id]
        if not remaining and app.status == "已上传":
            app.status = "未上传"
            app.updated_at = now
            db.add(app)

    create_community_join_action_log(
        db,
        CommunityJoinActionLog(
            application_id=application_id,
            material_file_id=file_id,
            action_type="material_delete",
            action_summary="后台删除材料",
            action_detail=file_item.original_file_name,
            operated_by_admin_user_id=admin_user_id,
            operated_by_name=admin_name,
            operated_at=now,
            created_at=now,
        ),
    )
    db.commit()
    return file_item.storage_path


def get_community_join_material_for_download(
    db: Session, application_id: int, file_id: int
) -> CommunityJoinMaterialFile:
    file_item = get_community_join_material_file_by_id(db, file_id)
    if file_item is None or file_item.application_id != application_id or file_item.is_deleted:
        raise ValueError("材料文件不存在")
    return file_item
