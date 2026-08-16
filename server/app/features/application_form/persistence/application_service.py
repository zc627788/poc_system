import json
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session

from app.features.application_form.persistence.payload_mapper import payload_to_dict
from app.features.application_form.schemas.submit_request import (
    ApplicationFormDraftClearResponse,
    ApplicationFormDraftResponse,
    ApplicationFormDraftSaveResponse,
    ApplicationFormSubmitRequest,
    ApplicationFormSubmitResponse,
)
from app.features.application_form.validation.images import validate_image_files, validate_required_images
from app.features.application_form.validation.premises import validate_premises_source
from app.features.application_form.validation.required import validate_payload_shape, validate_required_fields
from app.models.opc_application import OpcApplication
from app.models.opc_application_action_log import OpcApplicationActionLog
from app.models.opc_application_draft import OpcApplicationDraft
from app.repositories.opc_application import create_opc_application
from app.repositories.opc_application_action_log import create_opc_action_log
from app.repositories.opc_application_draft import (
    create_opc_application_draft,
    delete_opc_application_draft,
    get_opc_application_draft_by_site_user,
    update_opc_application_draft,
)
from app.repositories.opc_application_material_file import update_opc_material_file


def submit_application_form(db: Session, site_user_id: int, payload: ApplicationFormSubmitRequest) -> ApplicationFormSubmitResponse:
    validate_payload_shape(payload, require_shareholder=True)
    validate_required_fields(payload)
    validate_required_images(payload)
    files = validate_image_files(db, site_user_id, payload)
    validate_premises_source(db, site_user_id, payload, files)

    now = datetime.utcnow()
    payload_json = json.dumps(payload_to_dict(payload), ensure_ascii=False)
    app = OpcApplication(
        application_no=_generate_application_no(),
        site_user_id=site_user_id,
        source_module="application_form",
        status="待审核",
        is_missing_materials=0,
        submitted_at=now,
        latest_status_at=now,
        company_name="application_form_payload",
        registered_capital="0",
        currency="人民币",
        business_scope="application_form_payload",
        mailing_status="待开发",
        form_snapshot_json="{}",
        premises_source_json=None,
        application_form_payload_json=payload_json,
    )
    create_opc_application(db, app)
    for item in files:
        item.application_id = app.id
        update_opc_material_file(db, item)
    create_opc_action_log(
        db,
        OpcApplicationActionLog(
            application_id=app.id,
            action_type="application_submit",
            action_target="application",
            action_summary="前台提交申请",
            action_detail=app.application_no,
            operated_by_site_user_id=site_user_id,
        ),
    )
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    if draft is not None:
        delete_opc_application_draft(db, draft)
    db.commit()
    db.refresh(app)
    return ApplicationFormSubmitResponse(
        id=app.id,
        application_no=app.application_no,
        status=app.status,
        submitted_at=app.submitted_at.isoformat(),
    )


def get_application_form_draft(db: Session, site_user_id: int) -> ApplicationFormDraftResponse:
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    if draft is None or not draft.payload_json:
        return ApplicationFormDraftResponse(draft=None)
    try:
        return ApplicationFormDraftResponse(draft=ApplicationFormSubmitRequest(**json.loads(draft.payload_json)))
    except (TypeError, json.JSONDecodeError, ValueError):
        return ApplicationFormDraftResponse(draft=None)


def save_application_form_draft(db: Session, site_user_id: int, payload: ApplicationFormSubmitRequest) -> ApplicationFormDraftSaveResponse:
    validate_payload_shape(payload, require_shareholder=False)
    validate_image_files(db, site_user_id, payload)
    payload_json = json.dumps(payload_to_dict(payload), ensure_ascii=False)
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    if draft is None:
        draft = OpcApplicationDraft(
            site_user_id=site_user_id,
            form_data="{}",
            shareholders_data="[]",
            material_refs="{}",
            payload_json=payload_json,
        )
        create_opc_application_draft(db, draft)
    else:
        draft.payload_json = payload_json
        update_opc_application_draft(db, draft)
    db.commit()
    db.refresh(draft)
    return ApplicationFormDraftSaveResponse(ok=True, updated_at=draft.updated_at.isoformat())


def clear_application_form_draft(db: Session, site_user_id: int) -> ApplicationFormDraftClearResponse:
    draft = get_opc_application_draft_by_site_user(db, site_user_id)
    if draft is not None:
        delete_opc_application_draft(db, draft)
        db.commit()
    return ApplicationFormDraftClearResponse(ok=True)


def _generate_application_no() -> str:
    return f"OPC{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{uuid4().hex[:6].upper()}"
