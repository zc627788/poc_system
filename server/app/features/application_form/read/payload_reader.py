import json
from typing import Any

from app.models.opc_application import OpcApplication


def read_application_form_payload(application: OpcApplication) -> dict[str, Any] | None:
    if not application.application_form_payload_json:
        return None
    try:
        payload = json.loads(application.application_form_payload_json)
    except (TypeError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def has_application_form_payload(application: OpcApplication) -> bool:
    return read_application_form_payload(application) is not None


def get_payload_field(payload: dict[str, Any] | None, fkey: str) -> str | None:
    if not payload:
        return None
    for section in _iter_section_dicts(payload.get("sections")):
        for field in _iter_field_dicts(section.get("fields")):
            if field.get("fkey") == fkey:
                return _clean_value(field.get("value"))
    return None


def get_payload_fields(payload: dict[str, Any] | None) -> dict[str, str | None]:
    result: dict[str, str | None] = {}
    if not payload:
        return result
    for section in _iter_section_dicts(payload.get("sections")):
        for field in _iter_field_dicts(section.get("fields")):
            fkey = field.get("fkey")
            if isinstance(fkey, str) and fkey:
                result[fkey] = _clean_value(field.get("value"))
    return result


def get_payload_shareholders(payload: dict[str, Any] | None) -> list[dict[str, str | None]]:
    shareholders: list[dict[str, str | None]] = []
    if not payload:
        return shareholders
    for section in _iter_section_dicts(payload.get("shareholder_sections")):
        fields = {
            field.get("fkey"): _clean_value(field.get("value"))
            for field in _iter_field_dicts(section.get("fields"))
            if isinstance(field.get("fkey"), str)
        }
        shareholders.append(
            {
                "type": _clean_value(section.get("label")),
                "name": fields.get("name"),
                "id_no": fields.get("id_no"),
                "subscribed_capital": fields.get("subscribed_capital"),
                "equity_ratio": fields.get("equity_ratio"),
                "address": fields.get("address"),
                "phone": fields.get("phone"),
                "valid_until": fields.get("valid_until"),
            }
        )
    return shareholders


def get_payload_premises_source_text(payload: dict[str, Any] | None) -> str | None:
    if not payload:
        return None
    source = payload.get("premises_source")
    if not isinstance(source, dict):
        return None
    source_type = source.get("type")
    if source_type == "lease_material":
        return "租赁材料"
    if source_type == "rental_community":
        community_id = _clean_value(source.get("community_id"))
        return f"租赁社区入驻申请：{community_id}" if community_id else "租赁社区入驻申请"
    return _clean_value(source_type)


def _iter_section_dicts(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _iter_field_dicts(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _clean_value(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None
