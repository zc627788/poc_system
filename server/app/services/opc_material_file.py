from pathlib import Path
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.opc_application_action_log import OpcApplicationActionLog
from app.models.opc_application_material_file import OpcApplicationMaterialFile
from app.repositories.opc_application_action_log import create_opc_action_log
from app.repositories.opc_application_material_file import (
    create_opc_material_file,
    get_opc_material_file_by_id,
    update_opc_material_file,
)
from app.schemas.opc_application import OpcMaterialUploadItem
from app.services.opc_upload_storage import resolve_storage_path

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "docx"}
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg"}
DOCUMENT_EXTENSIONS = {"docx"}
IMAGE_MAX_SIZE = 10 * 1024 * 1024
DOCUMENT_MAX_SIZE = 20 * 1024 * 1024
MATERIAL_CATEGORIES = {
    "自然人股东身份证": {"required": True},
    "法人股东营业执照副本复印件加盖公章": {"required": True},
    "住所/经营场所租赁合同": {"required": True},
    "政府要求其他文件": {"required": False},
}
ALLOWED_MATERIAL_CATEGORIES = set(MATERIAL_CATEGORIES)


def required_material_categories() -> set[str]:
    return {key for key, config in MATERIAL_CATEGORIES.items() if config["required"]}


def validate_material_category(material_category: str) -> str:
    normalized = material_category.strip()
    if normalized not in ALLOWED_MATERIAL_CATEGORIES:
        raise ValueError("材料分类不合法，请刷新页面后重试")
    return normalized


def validate_material_file(file_name: str, file_size: int) -> str:
    extension = Path(file_name).suffix.lower().lstrip(".")
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("仅支持 png、jpg、jpeg、docx 格式文件")
    if extension in IMAGE_EXTENSIONS and file_size > IMAGE_MAX_SIZE:
        raise ValueError("图片大小不能超过10MB")
    if extension in DOCUMENT_EXTENSIONS and file_size > DOCUMENT_MAX_SIZE:
        raise ValueError("文档大小不能超过20MB")
    return extension


def validate_material_upload(material_category: str, file_name: str, file_size: int) -> tuple[str, str]:
    return validate_material_category(material_category), validate_material_file(file_name, file_size)


def create_material_upload_record(
    db: Session,
    site_user_id: int,
    material_category: str,
    original_file_name: str,
    storage_path: str,
    file_size: int,
) -> OpcMaterialUploadItem:
    normalized_category, file_type = validate_material_upload(material_category, original_file_name, file_size)

    item = OpcApplicationMaterialFile(
        application_id=None,
        site_user_id=site_user_id,
        material_category=normalized_category,
        original_file_name=original_file_name.strip(),
        storage_path=storage_path.strip(),
        file_type=file_type,
        file_size=file_size,
        upload_status="uploaded",
        is_deleted=0,
    )
    create_opc_material_file(db, item)
    db.commit()
    db.refresh(item)
    return _to_material_item(item)


def mark_material_file_deleted(item: OpcApplicationMaterialFile, admin_user_id: int | None = None) -> None:
    item.is_deleted = 1
    item.upload_status = "deleted"
    item.deleted_at = datetime.utcnow()
    if admin_user_id is not None:
        item.deleted_by_admin_user_id = admin_user_id


def mark_material_deleted_before_submit(db: Session, site_user_id: int, file_id: int) -> str:
    item = get_opc_material_file_by_id(db, file_id)
    if item is None or item.site_user_id != site_user_id:
        raise ValueError("材料文件不存在")
    if item.application_id is not None:
        raise ValueError("已提交申请的材料不能在这里删除")
    mark_material_file_deleted(item)
    update_opc_material_file(db, item)
    db.commit()
    return item.storage_path


def mark_material_deleted_by_admin(
    db: Session,
    application_id: int,
    admin_user_id: int,
    admin_name: str,
    file_id: int,
) -> str:
    item = get_opc_material_file_by_id(db, file_id)
    if item is None or item.application_id != application_id:
        raise ValueError("材料文件不存在")
    if item.is_deleted == 1:
        return item.storage_path
    mark_material_file_deleted(item, admin_user_id=admin_user_id)
    update_opc_material_file(db, item)
    create_opc_action_log(
        db,
        OpcApplicationActionLog(
            application_id=application_id,
            material_file_id=item.id,
            action_type="material_delete",
            action_target="material_file",
            action_summary="后台删除附件",
            action_detail=item.original_file_name,
            operated_by_admin_user_id=admin_user_id,
            operated_by_name=admin_name,
        ),
    )
    db.commit()
    return item.storage_path


def record_material_download(db: Session, application_id: int, admin_user_id: int, admin_name: str, file_id: int) -> None:
    item = get_opc_material_file_by_id(db, file_id)
    if item is None or item.application_id != application_id or item.is_deleted == 1:
        raise ValueError("材料文件不存在")
    create_opc_action_log(
        db,
        OpcApplicationActionLog(
            application_id=application_id,
            material_file_id=item.id,
            action_type="material_download",
            action_target="material_file",
            action_summary="后台下载附件",
            action_detail=item.original_file_name,
            operated_by_admin_user_id=admin_user_id,
            operated_by_name=admin_name,
        ),
    )
    db.commit()


def delete_material_file_from_disk(storage_path: str | None) -> None:
    file_path = resolve_storage_path(storage_path)
    if file_path is None:
        return
    if file_path.exists() and file_path.is_file():
        file_path.unlink(missing_ok=True)


def _to_material_item(item: OpcApplicationMaterialFile) -> OpcMaterialUploadItem:
    return OpcMaterialUploadItem(
        id=item.id,
        application_id=item.application_id,
        site_user_id=item.site_user_id,
        material_category=item.material_category,
        original_file_name=item.original_file_name,
        storage_path=item.storage_path,
        file_type=item.file_type,
        file_size=item.file_size,
        uploaded_at=item.uploaded_at.isoformat(),
        is_deleted=bool(item.is_deleted),
    )
