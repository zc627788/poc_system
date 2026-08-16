from sqlalchemy.orm import Session

from app.features.application_form.config.form_config import IMAGE_GROUPS
from app.features.application_form.schemas.submit_request import ApplicationFormSubmitRequest
from app.models.opc_application_material_file import OpcApplicationMaterialFile
from app.repositories.opc_application_material_file import list_opc_material_files_by_ids


def collect_file_ids(payload: ApplicationFormSubmitRequest) -> list[int]:
    ids: list[int] = []
    for image in payload.images:
        ids.extend(file.file_id for file in image.files)
    return list(dict.fromkeys(ids))


def validate_required_images(payload: ApplicationFormSubmitRequest) -> None:
    images = {item.key: item for item in payload.images}
    skip_lease = payload.premises_source is not None and payload.premises_source.type == "rental_community"
    for config in IMAGE_GROUPS:
        if not config["required"]:
            continue
        if skip_lease and config["key"] == "住所/经营场所租赁合同":
            continue
        if len(images.get(config["key"]).files if images.get(config["key"]) else []) == 0:
            raise ValueError(f"请上传{config['label']}")


def validate_image_files(db: Session, site_user_id: int, payload: ApplicationFormSubmitRequest) -> list[OpcApplicationMaterialFile]:
    ids = collect_file_ids(payload)
    files = list_opc_material_files_by_ids(db, ids)
    by_id = {item.id: item for item in files}
    if len(by_id) != len(ids):
        raise ValueError("材料文件不存在，请重新上传")
    for image in payload.images:
        for file in image.files:
            material = by_id[file.file_id]
            if material.site_user_id != site_user_id:
                raise ValueError("材料文件不存在")
            if material.is_deleted == 1:
                raise ValueError("材料文件已删除，请重新上传")
            if material.application_id is not None:
                raise ValueError("已提交申请的材料不能重复提交")
            if material.material_category != image.key:
                raise ValueError("材料分类不匹配，请重新上传")
    return files
