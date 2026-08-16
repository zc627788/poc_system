from io import BytesIO

from openpyxl import Workbook
from sqlalchemy.orm import Session

from app.features.application_form.read.payload_reader import (
    get_payload_field,
    get_payload_premises_source_text,
    get_payload_shareholders,
    read_application_form_payload,
)
from app.repositories.opc_application import list_opc_applications_by_ids
from app.repositories.site_user import get_site_user_by_id

EXPORT_HEADERS: list[tuple[str, str]] = [
    ("申请编号", "application_no"),
    ("提交人", "submitter_name"),
    ("提交人手机号", "submitter_phone"),
    ("企业名称", "company_name"),
    ("状态", "status"),
    ("是否缺材料", "is_missing_materials"),
    ("提交时间", "created_at"),
    ("最近更新时间", "latest_updated_at"),
    ("企业名称备注", "company_name_note"),
    ("注册资本", "registered_capital"),
    ("币种", "currency"),
    ("经营范围", "business_scope"),
    ("股东一类型", "shareholder_one_type"),
    ("股东一姓名", "shareholder_one_name"),
    ("股东一身份证号", "shareholder_one_id_no"),
    ("股东一认缴出资额", "shareholder_one_subscribed_capital"),
    ("股东一股权比例", "shareholder_one_equity_ratio"),
    ("股东一证件证件住址", "shareholder_one_address"),
    ("股东一电话", "shareholder_one_phone"),
    ("股东一有效期", "shareholder_one_valid_until"),
    ("股东二类型", "shareholder_two_type"),
    ("股东二姓名", "shareholder_two_name"),
    ("股东二身份证号", "shareholder_two_id_no"),
    ("股东二认缴出资额", "shareholder_two_subscribed_capital"),
    ("股东二股权比例", "shareholder_two_equity_ratio"),
    ("股东二证件证件住址", "shareholder_two_address"),
    ("股东二电话", "shareholder_two_phone"),
    ("股东二有效期", "shareholder_two_valid_until"),
    ("法定代表人姓名", "legal_representative_name"),
    ("法定代表人电话", "legal_representative_phone"),
    ("法定代表人身份证号", "legal_representative_id_no"),
    ("法定代表人证件住址", "legal_representative_address"),
    ("经理姓名", "manager_name"),
    ("经理电话", "manager_phone"),
    ("财务负责人姓名", "finance_leader_name"),
    ("财务负责人电话", "finance_leader_phone"),
    ("监事姓名", "supervisor_name"),
    ("监事电话", "supervisor_phone"),
    ("工商联络人姓名", "industrial_contact_name"),
    ("工商联络人电话", "industrial_contact_phone"),
    ("是否邮寄", "mailing_status"),
    ("住所来源凭证", "premises_source_json"),
]

MODEL_FIELDS = [field for _, field in EXPORT_HEADERS]


def build_export_workbook(db: Session, application_ids: list[int]) -> tuple[bytes, list[str]]:
    items = list_opc_applications_by_ids(db, application_ids)
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "OPC申请导出"
    worksheet.append([header for header, _ in EXPORT_HEADERS])

    exported_application_nos: list[str] = []
    for item in items:
        user = get_site_user_by_id(db, item.site_user_id)
        payload = read_application_form_payload(item)
        shareholders = get_payload_shareholders(payload)
        shareholder_one = shareholders[0] if len(shareholders) > 0 else {}
        shareholder_two = shareholders[1] if len(shareholders) > 1 else {}
        row_data = {
            "application_no": item.application_no,
            "submitter_name": user.name if user else "",
            "submitter_phone": user.phone if user else "",
            "company_name": _payload_or_model(payload, item, "company_name"),
            "status": item.status,
            "is_missing_materials": "是" if item.is_missing_materials else "否",
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "",
            "latest_updated_at": item.updated_at.strftime("%Y-%m-%d %H:%M:%S") if item.updated_at else "",
            "company_name_note": item.company_name_note,
            "registered_capital": _payload_or_model(payload, item, "registered_capital"),
            "currency": _payload_or_model(payload, item, "currency"),
            "business_scope": _payload_or_model(payload, item, "business_scope"),
            "shareholder_one_type": shareholder_one.get("type") if payload else item.shareholder_one_type,
            "shareholder_one_name": shareholder_one.get("name") if payload else item.shareholder_one_name,
            "shareholder_one_id_no": shareholder_one.get("id_no") if payload else item.shareholder_one_id_no,
            "shareholder_one_subscribed_capital": shareholder_one.get("subscribed_capital") if payload else item.shareholder_one_subscribed_capital,
            "shareholder_one_equity_ratio": shareholder_one.get("equity_ratio") if payload else item.shareholder_one_equity_ratio,
            "shareholder_one_address": shareholder_one.get("address") if payload else item.shareholder_one_address,
            "shareholder_one_phone": shareholder_one.get("phone") if payload else item.shareholder_one_phone,
            "shareholder_one_valid_until": shareholder_one.get("valid_until") if payload else item.shareholder_one_valid_until,
            "shareholder_two_type": shareholder_two.get("type") if payload else item.shareholder_two_type,
            "shareholder_two_name": shareholder_two.get("name") if payload else item.shareholder_two_name,
            "shareholder_two_id_no": shareholder_two.get("id_no") if payload else item.shareholder_two_id_no,
            "shareholder_two_subscribed_capital": shareholder_two.get("subscribed_capital") if payload else item.shareholder_two_subscribed_capital,
            "shareholder_two_equity_ratio": shareholder_two.get("equity_ratio") if payload else item.shareholder_two_equity_ratio,
            "shareholder_two_address": shareholder_two.get("address") if payload else item.shareholder_two_address,
            "shareholder_two_phone": shareholder_two.get("phone") if payload else item.shareholder_two_phone,
            "shareholder_two_valid_until": shareholder_two.get("valid_until") if payload else item.shareholder_two_valid_until,
            "legal_representative_name": _payload_or_model(payload, item, "legal_representative_name"),
            "legal_representative_phone": _payload_or_model(payload, item, "legal_representative_phone"),
            "legal_representative_id_no": _payload_or_model(payload, item, "legal_representative_id_no"),
            "legal_representative_address": _payload_or_model(payload, item, "legal_representative_address"),
            "manager_name": _payload_or_model(payload, item, "manager_name"),
            "manager_phone": _payload_or_model(payload, item, "manager_phone"),
            "finance_leader_name": _payload_or_model(payload, item, "finance_leader_name"),
            "finance_leader_phone": _payload_or_model(payload, item, "finance_leader_phone"),
            "supervisor_name": _payload_or_model(payload, item, "supervisor_name"),
            "supervisor_phone": _payload_or_model(payload, item, "supervisor_phone"),
            "industrial_contact_name": _payload_or_model(payload, item, "industrial_contact_name"),
            "industrial_contact_phone": _payload_or_model(payload, item, "industrial_contact_phone"),
            "mailing_status": item.mailing_status,
            "premises_source_json": get_payload_premises_source_text(payload) if payload else item.premises_source_json,
        }
        worksheet.append([row_data.get(field) or "" for field in MODEL_FIELDS])
        exported_application_nos.append(item.application_no)

    for column_cells in worksheet.columns:
        max_length = max(len(str(cell.value or "")) for cell in column_cells)
        worksheet.column_dimensions[column_cells[0].column_letter].width = min(max(max_length + 2, 12), 40)

    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    return output.getvalue(), exported_application_nos


def _payload_or_model(payload: dict | None, item, fkey: str) -> str | None:
    if payload is not None:
        return get_payload_field(payload, fkey)
    return getattr(item, fkey)
