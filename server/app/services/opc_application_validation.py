from sqlalchemy.orm import Session

from app.repositories.community_join import get_community_join_application_by_id
from app.schemas.opc_application import OpcApplicationPremisesSourceRequest, OpcApplicationSubmitRequest
from app.services.opc_material_file import required_material_categories

PREMISES_LEASE_CATEGORY = "住所/经营场所租赁合同"


def validate_submission_payload(payload: OpcApplicationSubmitRequest) -> None:
    if len(payload.shareholders) > 50:
        raise ValueError("股东数量最多支持 50 个")
    missing_labels = [
        label
        for field, label in _required_fields(payload)
        if not _has_required_payload_value(payload, field)
    ]
    if missing_labels:
        raise ValueError(f"请填写必填字段：{'、'.join(missing_labels)}")


def validate_submission_materials(
    site_user_id: int,
    file_ids: list[int],
    files: list,
    premises_source: OpcApplicationPremisesSourceRequest | None = None,
) -> None:
    if not file_ids or len(files) != len(set(file_ids)):
        raise ValueError("请按要求上传全部必传材料后再提交")
    categories = set()
    for item in files:
        if item.site_user_id != site_user_id or item.is_deleted == 1:
            raise ValueError("上传材料无效，请重新上传后再提交")
        if item.application_id is not None:
            raise ValueError("上传材料已绑定其它申请，请重新上传后再提交")
        categories.add(item.material_category)
    required_categories = required_material_categories()
    if premises_source and premises_source.type == "rental_community":
        required_categories = required_categories - {PREMISES_LEASE_CATEGORY}
    if not required_categories.issubset(categories):
        raise ValueError("请按要求上传全部必传材料后再提交")


def validate_submission_premises_source(
    db: Session,
    premises_source: OpcApplicationPremisesSourceRequest | None,
    files: list,
) -> None:
    if premises_source is None:
        raise ValueError("请选择住所来源")

    if premises_source.type == "lease_material":
        categories = {item.material_category for item in files}
        if PREMISES_LEASE_CATEGORY not in categories:
            raise ValueError("请上传住所/经营场所租赁合同")
        return

    if premises_source.type == "rental_community":
        if not premises_source.community_join_application_id:
            raise ValueError("请先完成租赁社区入驻申请")
        app = get_community_join_application_by_id(db, premises_source.community_join_application_id)
        if app is None:
            raise ValueError("请先完成租赁社区入驻申请")
        return

    raise ValueError("住所来源无效")


def clean_optional(value: str | None) -> str | None:
    return value.strip() if value and value.strip() else None


def _required_fields(payload: OpcApplicationSubmitRequest) -> list[tuple[str, str]]:
    return [
        (item.field.strip(), item.label.strip() or item.field.strip())
        for item in payload.required.fields
        if item.required and item.field and item.field.strip()
    ]


def _has_required_value(value: object) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if value is None:
        return False
    return True


def _has_required_payload_value(payload: OpcApplicationSubmitRequest, field: str) -> bool:
    if field.startswith("shareholders."):
        shareholder_field = field.split(".", 1)[1]
        return bool(payload.shareholders) and any(
            _has_required_value(getattr(item, shareholder_field, None)) for item in payload.shareholders
        )
    return _has_required_value(getattr(payload, field, None))
