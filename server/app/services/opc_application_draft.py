import json
from typing import Any

from sqlalchemy.orm import Session

from app.models.opc_application_draft import OpcApplicationDraft
from app.models.opc_application_material_file import OpcApplicationMaterialFile
from app.repositories.opc_application_draft import (
    create_opc_application_draft,
    delete_opc_application_draft,
    get_opc_application_draft_by_site_user,
    update_opc_application_draft,
)
from app.repositories.opc_application_material_file import list_opc_material_files_by_ids
from app.schemas.opc_application import (
    OpcApplicationDraftData,
    OpcApplicationDraftClearResponse,
    OpcApplicationDraftResponse,
    OpcApplicationDraftSaveRequest,
    OpcApplicationDraftSaveResponse,
    OpcMaterialUploadItem,
)


def get_application_draft(db: Session, site_user_id: int) -> OpcApplicationDraftResponse:
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    if draft is None:
        return OpcApplicationDraftResponse(draft=None)
    return OpcApplicationDraftResponse(draft=_to_draft_data(db, draft))


def save_application_draft(
    db: Session,
    site_user_id: int,
    payload: OpcApplicationDraftSaveRequest,
) -> OpcApplicationDraftSaveResponse:
    material_refs = _build_material_refs(db, site_user_id, payload)
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    form_data = _dump_json(payload.form)
    shareholders_data = _dump_json(payload.shareholders)
    material_refs_data = _dump_json(material_refs)

    if draft is None:
        draft = OpcApplicationDraft(
            site_user_id=site_user_id,
            form_data=form_data,
            shareholders_data=shareholders_data,
            material_refs=material_refs_data,
        )
        create_opc_application_draft(db, draft)
    else:
        draft.form_data = form_data
        draft.shareholders_data = shareholders_data
        draft.material_refs = material_refs_data
        update_opc_application_draft(db, draft)

    db.commit()
    db.refresh(draft)
    return OpcApplicationDraftSaveResponse(ok=True, updated_at=draft.updated_at.isoformat())


def clear_application_draft(db: Session, site_user_id: int) -> OpcApplicationDraftClearResponse:
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    if draft is not None:
        delete_opc_application_draft(db, draft)
        db.commit()
    return OpcApplicationDraftClearResponse(ok=True)


def _build_material_refs(
    db: Session,
    site_user_id: int,
    payload: OpcApplicationDraftSaveRequest,
) -> dict[str, list[dict[str, Any]]]:
    ids: list[int] = []
    for items in payload.materials.values():
        ids.extend(item.id for item in items)

    unique_ids = list(dict.fromkeys(ids))
    files = list_opc_material_files_by_ids(db, unique_ids)
    by_id = {item.id: item for item in files}
    if len(by_id) != len(unique_ids):
        raise ValueError("草稿材料文件不存在，请重新上传后再保存")

    material_refs: dict[str, list[dict[str, Any]]] = {}
    for category, items in payload.materials.items():
        category_refs: list[dict[str, Any]] = []
        for request_item in items:
            material_file = by_id[request_item.id]
            _validate_draft_material(site_user_id, material_file)
            if material_file.material_category != category:
                raise ValueError("草稿材料分类不匹配，请重新上传后再保存")
            category_refs.append({"id": material_file.id})
        material_refs[category] = category_refs
    return material_refs


def _validate_draft_material(site_user_id: int, item: OpcApplicationMaterialFile) -> None:
    if item.site_user_id != site_user_id or item.is_deleted == 1:
        raise ValueError("草稿材料无效，请重新上传后再保存")
    if item.application_id is not None:
        raise ValueError("已提交申请的材料不能保存为草稿")


def _to_draft_data(db: Session, draft: OpcApplicationDraft) -> OpcApplicationDraftData:
    return OpcApplicationDraftData(
        form=_load_json_object(draft.form_data),
        shareholders=_load_json_list(draft.shareholders_data),
        materials=_load_material_refs(db, draft.material_refs, draft.site_user_id),
        updated_at=draft.updated_at.isoformat(),
    )


def _load_material_refs(db: Session, value: str, site_user_id: int) -> dict[str, list[OpcMaterialUploadItem]]:
    raw = _load_json_object(value)
    ids: list[int] = []
    for items in raw.values():
        if isinstance(items, list):
            for item in items:
                if isinstance(item, dict) and isinstance(item.get("id"), int):
                    ids.append(item["id"])
    by_id = {item.id: item for item in list_opc_material_files_by_ids(db, list(dict.fromkeys(ids)))}
    result: dict[str, list[OpcMaterialUploadItem]] = {}
    for category, items in raw.items():
        if not isinstance(items, list):
            continue
        parsed_items: list[OpcMaterialUploadItem] = []
        for item in items:
            if not isinstance(item, dict) or not isinstance(item.get("id"), int):
                continue
            material_file = by_id.get(item["id"])
            if material_file is None:
                continue
            if material_file.site_user_id != site_user_id or material_file.is_deleted == 1 or material_file.application_id is not None:
                continue
            parsed_items.append(OpcMaterialUploadItem(**_material_to_dict(material_file)))
        result[category] = parsed_items
    return result


def _material_to_dict(item: OpcApplicationMaterialFile) -> dict[str, Any]:
    return {
        "id": item.id,
        "application_id": item.application_id,
        "site_user_id": item.site_user_id,
        "material_category": item.material_category,
        "original_file_name": item.original_file_name,
        "storage_path": item.storage_path,
        "file_type": item.file_type,
        "file_size": item.file_size,
        "uploaded_at": item.uploaded_at.isoformat(),
        "is_deleted": bool(item.is_deleted),
    }


def _dump_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _load_json_object(value: str) -> dict[str, Any]:
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _load_json_list(value: str) -> list[dict[str, Any]]:
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []
    return [item for item in parsed if isinstance(item, dict)] if isinstance(parsed, list) else []
