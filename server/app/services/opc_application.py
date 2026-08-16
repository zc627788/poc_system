import json
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.opc_application import OpcApplication
from app.models.opc_application_action_log import OpcApplicationActionLog
from app.models.opc_application_review_record import OpcApplicationReviewRecord
from app.repositories.opc_application import create_opc_application, get_opc_application_by_id, list_admin_opc_applications, list_opc_applications_by_site_user, update_opc_application
from app.repositories.opc_application_action_log import create_opc_action_log
from app.repositories.opc_application_material_file import list_opc_material_files_by_ids, update_opc_material_file
from app.repositories.opc_application_review_record import create_opc_review_record
from app.repositories.site_user import get_site_user_by_id
from app.schemas.opc_application import OpcApplicationDetailResponse, OpcApplicationListResponse, OpcApplicationMissingMaterialsRequest, OpcApplicationReviewRequest, OpcApplicationSubmitRequest, OpcApplicationSubmitResponse
from app.services.opc_application_mapper import to_application_detail, to_application_list_item
from app.services.opc_application_validation import clean_optional, validate_submission_materials, validate_submission_payload, validate_submission_premises_source
from app.services.opc_sms import sms_service

VALID_STATUSES = {"待审核", "审核通过", "审核不通过", "办理完成"}
SMS_TRIGGER_STATUSES = {"审核通过", "办理完成"}


def create_application_submission(db: Session, site_user_id: int, payload: OpcApplicationSubmitRequest) -> OpcApplicationSubmitResponse:
    validate_submission_payload(payload)
    files = list_opc_material_files_by_ids(db, payload.material_file_ids)
    validate_submission_materials(site_user_id, payload.material_file_ids, files, payload.premises_source)
    validate_submission_premises_source(db, payload.premises_source, files)
    now = datetime.utcnow()
    app = OpcApplication(application_no=_generate_application_no(), site_user_id=site_user_id, source_module="opc_application", status="待审核", is_missing_materials=0, submitted_at=now, latest_status_at=now)
    for name in OpcApplicationSubmitRequest.model_fields:
        if hasattr(app, name) and name not in {"material_file_ids", "premises_source", "required", "shareholders"}:
            value = getattr(payload, name)
            setattr(app, name, value.strip() if isinstance(value, str) and value.strip() else value)
    if payload.premises_source is not None:
        app.premises_source_json = json.dumps(payload.premises_source.model_dump(), ensure_ascii=False)
    normalized_shareholders = [_normalize_shareholder(item) for item in payload.shareholders][:50]
    if not normalized_shareholders:
        normalized_shareholders = _legacy_shareholders_from_payload(payload)
    app.shareholders_json = json.dumps(normalized_shareholders, ensure_ascii=False)
    _sync_legacy_shareholder_columns(app, normalized_shareholders)
    create_opc_application(db, app)
    for item in files:
        item.application_id = app.id
        update_opc_material_file(db, item)
    create_opc_action_log(db, OpcApplicationActionLog(application_id=app.id, action_type="application_submit", action_target="application", action_summary="前台提交申请", action_detail=app.application_no, operated_by_site_user_id=site_user_id))
    db.commit()
    db.refresh(app)
    return OpcApplicationSubmitResponse(id=app.id, application_no=app.application_no, status=app.status, submitted_at=app.submitted_at.isoformat())



def list_site_user_applications(db: Session, site_user_id: int, page: int = 1, page_size: int = 10) -> OpcApplicationListResponse:
    items, total = list_opc_applications_by_site_user(db, site_user_id, page, page_size)
    return OpcApplicationListResponse(items=[to_application_list_item(db, x) for x in items], total=total, page=page, page_size=page_size)



def list_admin_application_summaries(db: Session, submitter_keyword: str | None = None, status: str | None = None, start_time: datetime | None = None, end_time: datetime | None = None, page: int = 1, page_size: int = 10) -> OpcApplicationListResponse:
    items, total = list_admin_opc_applications(db, submitter_keyword, status, start_time, end_time, page, page_size)
    return OpcApplicationListResponse(items=[to_application_list_item(db, x) for x in items], total=total, page=page, page_size=page_size)



def get_application_detail(db: Session, application_id: int) -> OpcApplicationDetailResponse:
    app = get_opc_application_by_id(db, application_id)
    if app is None:
        raise ValueError("application not found")
    return to_application_detail(db, app)



def get_site_user_application_detail(db: Session, site_user_id: int, application_id: int) -> OpcApplicationDetailResponse:
    app = get_opc_application_by_id(db, application_id)
    if app is None or app.site_user_id != site_user_id:
        raise ValueError("application not found")
    return to_application_detail(db, app)



def review_application(db: Session, application_id: int, admin_user_id: int, admin_name: str, payload: OpcApplicationReviewRequest) -> OpcApplicationDetailResponse:
    app = get_opc_application_by_id(db, application_id)
    if app is None:
        raise ValueError("application not found")
    if payload.status not in VALID_STATUSES:
        raise ValueError("invalid review status")
    if payload.status == "审核不通过" and not (payload.reject_reason and payload.reject_reason.strip()):
        raise ValueError("reject reason is required")
    now = datetime.utcnow()
    previous_status = app.status
    app.status = payload.status
    app.latest_status_at = now
    app.reviewed_at = now
    update_opc_application(db, app)
    create_opc_review_record(db, OpcApplicationReviewRecord(application_id=app.id, previous_status=previous_status, current_status=payload.status, reject_reason=clean_optional(payload.reject_reason), user_visible_note=clean_optional(payload.user_visible_note), internal_note=clean_optional(payload.internal_note), operated_by_admin_user_id=admin_user_id, operated_by_name=admin_name, operated_at=now))
    create_opc_action_log(db, OpcApplicationActionLog(application_id=app.id, action_type="status_change", action_target="application", action_summary=f"状态更新为{payload.status}", action_detail=clean_optional(payload.reject_reason), operated_by_admin_user_id=admin_user_id, operated_by_name=admin_name, operated_at=now))

    if payload.status in SMS_TRIGGER_STATUSES:
        site_user = get_site_user_by_id(db, app.site_user_id)
        sms_result = sms_service.send_status_sms(phone=site_user.phone if site_user else None, status=payload.status)
        create_opc_action_log(
            db,
            OpcApplicationActionLog(
                application_id=app.id,
                action_type="sms_notify",
                action_target="application",
                action_summary=f"{payload.status}短信通知{'成功' if sms_result.success else '未发送'}",
                action_detail=sms_result.message if sms_result.success else f"{sms_result.message}；短信内容：{sms_result.content}",
                operated_by_admin_user_id=admin_user_id,
                operated_by_name=admin_name,
                operated_at=now,
            ),
        )

    db.commit()
    return to_application_detail(db, app)



def update_missing_materials_flag(db: Session, application_id: int, admin_user_id: int, admin_name: str, payload: OpcApplicationMissingMaterialsRequest) -> OpcApplicationDetailResponse:
    app = get_opc_application_by_id(db, application_id)
    if app is None:
        raise ValueError("application not found")
    app.is_missing_materials = 1 if payload.is_missing_materials else 0
    app.latest_status_at = datetime.utcnow()
    update_opc_application(db, app)
    create_opc_action_log(db, OpcApplicationActionLog(application_id=app.id, action_type="missing_materials_update", action_target="application", action_summary=f"缺材料标记更新为{'是' if payload.is_missing_materials else '否'}", operated_by_admin_user_id=admin_user_id, operated_by_name=admin_name))
    db.commit()
    return to_application_detail(db, app)



def _generate_application_no() -> str:
    return f"OPC{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid4().hex[:6].upper()}"


def _normalize_shareholder(item) -> dict[str, str | None]:
    return {
        "type": clean_optional(item.type),
        "name": clean_optional(item.name),
        "id_no": clean_optional(item.id_no),
        "subscribed_capital": clean_optional(item.subscribed_capital),
        "equity_ratio": clean_optional(item.equity_ratio),
        "address": clean_optional(item.address),
        "phone": clean_optional(item.phone),
        "valid_until": clean_optional(item.valid_until),
    }


def _sync_legacy_shareholder_columns(app: OpcApplication, shareholders: list[dict[str, str | None]]) -> None:
    for index, prefix in enumerate(("shareholder_one", "shareholder_two")):
        item = shareholders[index] if index < len(shareholders) else {}
        setattr(app, f"{prefix}_type", item.get("type"))
        setattr(app, f"{prefix}_name", item.get("name"))
        setattr(app, f"{prefix}_id_no", item.get("id_no"))
        setattr(app, f"{prefix}_subscribed_capital", item.get("subscribed_capital"))
        setattr(app, f"{prefix}_equity_ratio", item.get("equity_ratio"))
        setattr(app, f"{prefix}_address", item.get("address"))
        setattr(app, f"{prefix}_phone", item.get("phone"))
        setattr(app, f"{prefix}_valid_until", item.get("valid_until"))


def _legacy_shareholders_from_payload(payload: OpcApplicationSubmitRequest) -> list[dict[str, str | None]]:
    items = [
        {
            "type": clean_optional(payload.shareholder_one_type),
            "name": clean_optional(payload.shareholder_one_name),
            "id_no": clean_optional(payload.shareholder_one_id_no),
            "subscribed_capital": clean_optional(payload.shareholder_one_subscribed_capital),
            "equity_ratio": clean_optional(payload.shareholder_one_equity_ratio),
            "address": clean_optional(payload.shareholder_one_address),
            "phone": clean_optional(payload.shareholder_one_phone),
            "valid_until": clean_optional(payload.shareholder_one_valid_until),
        },
        {
            "type": clean_optional(payload.shareholder_two_type),
            "name": clean_optional(payload.shareholder_two_name),
            "id_no": clean_optional(payload.shareholder_two_id_no),
            "subscribed_capital": clean_optional(payload.shareholder_two_subscribed_capital),
            "equity_ratio": clean_optional(payload.shareholder_two_equity_ratio),
            "address": clean_optional(payload.shareholder_two_address),
            "phone": clean_optional(payload.shareholder_two_phone),
            "valid_until": clean_optional(payload.shareholder_two_valid_until),
        },
    ]
    return [item for item in items if any(item.values())]
