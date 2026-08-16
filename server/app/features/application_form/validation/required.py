from app.features.application_form.config.form_config import REQUIRED_GROUPS, SHAREHOLDER_REQUIRED_FIELDS
from app.features.application_form.schemas.submit_request import ApplicationFormSubmitRequest


def validate_payload_shape(payload: ApplicationFormSubmitRequest, *, require_shareholder: bool) -> None:
    if payload.version != 1:
        raise ValueError("payload version must be 1")
    seen: set[str] = set()
    for section in payload.sections:
        for field in section.fields:
            if field.fkey in seen:
                raise ValueError(f"字段重复：{field.fkey}")
            seen.add(field.fkey)
    for shareholder in payload.shareholder_sections:
        row_seen: set[str] = set()
        for field in shareholder.fields:
            if field.fkey in row_seen:
                raise ValueError(f"{shareholder.label}字段重复：{field.fkey}")
            row_seen.add(field.fkey)
    if require_shareholder and not payload.shareholder_sections:
        raise ValueError("请至少填写一个股东")


def validate_required_fields(payload: ApplicationFormSubmitRequest) -> None:
    fields = _section_field_map(payload)
    for group in REQUIRED_GROUPS:
        for field_config in group["fields"]:
            value = fields.get(field_config["fkey"])
            if not _has_value(value):
                raise ValueError(f"请填写{group['label']}{field_config['label']}")

    for shareholder in payload.shareholder_sections:
        row_fields = {field.fkey: field.value for field in shareholder.fields}
        for field_config in SHAREHOLDER_REQUIRED_FIELDS:
            if not _has_value(row_fields.get(field_config["fkey"])):
                raise ValueError(f"请填写{shareholder.label}{field_config['label']}")


def _section_field_map(payload: ApplicationFormSubmitRequest) -> dict[str, str | None]:
    result: dict[str, str | None] = {}
    for section in payload.sections:
        for field in section.fields:
            result[field.fkey] = field.value
    return result


def _has_value(value: str | None) -> bool:
    return bool(value and value.strip())
