import json

from sqlalchemy.orm import Session

from app.features.application_form.read.payload_reader import (
    get_payload_field,
    get_payload_premises_source_text,
    get_payload_shareholders,
    read_application_form_payload,
)
from app.models.opc_application import OpcApplication
from app.repositories.opc_application_action_log import list_opc_action_logs_by_application
from app.repositories.opc_application_material_file import list_opc_active_material_files_by_application
from app.repositories.opc_application_review_record import list_opc_review_records_by_application
from app.repositories.site_user import get_site_user_by_id
from app.schemas.opc_application import (
    OpcApplicationActionLogResponse,
    OpcApplicationDetailResponse,
    OpcApplicationListItemResponse,
    OpcApplicationReviewRecordResponse,
    OpcApplicationShareholderResponse,
    OpcMaterialUploadItem,
)
from app.services.opc_sms import parse_mailing_contact_info


def _build_submit_content(app: OpcApplication) -> str:
    payload = read_application_form_payload(app)
    if payload is not None:
        company_name = get_payload_field(payload, "company_name") or ""
        registered_capital = get_payload_field(payload, "registered_capital") or ""
        business_scope = get_payload_field(payload, "business_scope") or ""
    else:
        company_name = app.company_name
        registered_capital = app.registered_capital
        business_scope = app.business_scope
    return f"企业名称：{company_name}；注册资本：{registered_capital}；经营范围：{business_scope}"


def to_application_list_item(db: Session, app: OpcApplication) -> OpcApplicationListItemResponse:
    user = get_site_user_by_id(db, app.site_user_id)
    reviews = list_opc_review_records_by_application(db, app.id)
    last = reviews[-1] if reviews else None
    mailing_info = parse_mailing_contact_info(app.form_snapshot_json, app.mailing_status)
    payload = read_application_form_payload(app)
    return OpcApplicationListItemResponse(
        id=app.id,
        application_no=app.application_no,
        site_user_id=app.site_user_id,
        site_user_name=user.name if user else None,
        site_user_phone=user.phone if user else None,
        company_name=(get_payload_field(payload, "company_name") or "") if payload is not None else app.company_name,
        registered_capital=(get_payload_field(payload, "registered_capital") or "") if payload is not None else app.registered_capital,
        business_scope=(get_payload_field(payload, "business_scope") or "") if payload is not None else app.business_scope,
        submit_content=_build_submit_content(app),
        status=app.status,
        mailing_status=app.mailing_status,
        mailing_contact_info=mailing_info.summary,
        is_missing_materials=bool(app.is_missing_materials),
        reject_reason_summary=last.reject_reason if last else None,
        submitted_at=app.submitted_at.isoformat(),
        reviewed_at=app.reviewed_at.isoformat() if app.reviewed_at else None,
        updated_at=app.updated_at.isoformat(),
    )



def to_application_detail(db: Session, app: OpcApplication) -> OpcApplicationDetailResponse:
    user = get_site_user_by_id(db, app.site_user_id)
    data = {k: getattr(app, k) for k in OpcApplicationDetailResponse.model_fields if hasattr(app, k)}
    payload = read_application_form_payload(app)
    if payload is not None:
        _apply_payload_detail_fields(data, payload)
    for key in ["submitted_at", "reviewed_at", "latest_status_at", "created_at", "updated_at"]:
        value = data.get(key)
        data[key] = value.isoformat() if value else None
    data["site_user_name"] = user.name if user else None
    data["site_user_phone"] = user.phone if user else None
    data["is_missing_materials"] = bool(app.is_missing_materials)
    data["shareholders"] = _parse_shareholders(app, payload)
    data["materials"] = [
        OpcMaterialUploadItem(
            id=i.id,
            application_id=i.application_id,
            site_user_id=i.site_user_id,
            material_category=i.material_category,
            original_file_name=i.original_file_name,
            storage_path=i.storage_path,
            file_type=i.file_type,
            file_size=i.file_size,
            uploaded_at=i.uploaded_at.isoformat(),
            is_deleted=bool(i.is_deleted),
        )
        for i in list_opc_active_material_files_by_application(db, app.id)
    ]
    data["review_records"] = [
        OpcApplicationReviewRecordResponse(
            id=i.id,
            previous_status=i.previous_status,
            current_status=i.current_status,
            reject_reason=i.reject_reason,
            user_visible_note=i.user_visible_note,
            internal_note=i.internal_note,
            operated_by_admin_user_id=i.operated_by_admin_user_id,
            operated_by_name=i.operated_by_name,
            operated_at=i.operated_at.isoformat(),
        )
        for i in list_opc_review_records_by_application(db, app.id)
    ]
    data["action_logs"] = [
        OpcApplicationActionLogResponse(
            id=i.id,
            material_file_id=i.material_file_id,
            action_type=i.action_type,
            action_target=i.action_target,
            action_summary=i.action_summary,
            action_detail=i.action_detail,
            operated_by_admin_user_id=i.operated_by_admin_user_id,
            operated_by_site_user_id=i.operated_by_site_user_id,
            operated_by_name=i.operated_by_name,
            operated_at=i.operated_at.isoformat(),
        )
        for i in list_opc_action_logs_by_application(db, app.id)
    ]
    return OpcApplicationDetailResponse(**data)


def _apply_payload_detail_fields(data: dict, payload: dict) -> None:
    payload_field_map = {
        "company_name": "company_name",
        "company_name_alternative_one": "company_name_alternative_one",
        "company_name_alternative_two": "company_name_alternative_two",
        "registered_capital": "registered_capital",
        "currency": "currency",
        "business_scope": "business_scope",
        "legal_representative_name": "legal_representative_name",
        "legal_representative_phone": "legal_representative_phone",
        "legal_representative_id_no": "legal_representative_id_no",
        "legal_representative_address": "legal_representative_address",
        "manager_name": "manager_name",
        "manager_phone": "manager_phone",
        "manager_id_no": "manager_id_no",
        "manager_address": "manager_address",
        "finance_leader_name": "finance_leader_name",
        "finance_leader_phone": "finance_leader_phone",
        "finance_leader_id_no": "finance_leader_id_no",
        "finance_leader_address": "finance_leader_address",
        "supervisor_name": "supervisor_name",
        "supervisor_phone": "supervisor_phone",
        "supervisor_id_no": "supervisor_id_no",
        "supervisor_address": "supervisor_address",
        "industrial_contact_name": "industrial_contact_name",
        "industrial_contact_phone": "industrial_contact_phone",
        "industrial_contact_id_no": "industrial_contact_id_no",
        "industrial_contact_address": "industrial_contact_address",
    }
    for response_field, fkey in payload_field_map.items():
        data[response_field] = get_payload_field(payload, fkey)
    data["premises_source_json"] = get_payload_premises_source_text(payload)


def _parse_shareholders(app: OpcApplication, payload: dict | None = None) -> list[OpcApplicationShareholderResponse]:
    if payload is not None:
        return [OpcApplicationShareholderResponse(**item) for item in get_payload_shareholders(payload)]

    if app.shareholders_json:
        try:
            raw_items = json.loads(app.shareholders_json)
        except (TypeError, ValueError):
            raw_items = []
        if isinstance(raw_items, list):
            return [
                OpcApplicationShareholderResponse(
                    type=item.get("type"),
                    name=item.get("name"),
                    id_no=item.get("id_no"),
                    subscribed_capital=item.get("subscribed_capital"),
                    equity_ratio=item.get("equity_ratio"),
                    address=item.get("address"),
                    phone=item.get("phone"),
                    valid_until=item.get("valid_until"),
                )
                for item in raw_items[:50]
                if isinstance(item, dict)
            ]

    legacy_items = [
        {
            "type": app.shareholder_one_type,
            "name": app.shareholder_one_name,
            "id_no": app.shareholder_one_id_no,
            "subscribed_capital": app.shareholder_one_subscribed_capital,
            "equity_ratio": app.shareholder_one_equity_ratio,
            "address": app.shareholder_one_address,
            "phone": app.shareholder_one_phone,
            "valid_until": app.shareholder_one_valid_until,
        },
        {
            "type": app.shareholder_two_type,
            "name": app.shareholder_two_name,
            "id_no": app.shareholder_two_id_no,
            "subscribed_capital": app.shareholder_two_subscribed_capital,
            "equity_ratio": app.shareholder_two_equity_ratio,
            "address": app.shareholder_two_address,
            "phone": app.shareholder_two_phone,
            "valid_until": app.shareholder_two_valid_until,
        },
    ]
    return [OpcApplicationShareholderResponse(**item) for item in legacy_items if any(item.values())]
