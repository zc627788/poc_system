from typing import Any

from pydantic import BaseModel, Field


class OpcApplicationShareholderRequest(BaseModel):
    type: str | None = None
    name: str | None = None
    id_no: str | None = None
    subscribed_capital: str | None = None
    equity_ratio: str | None = None
    address: str | None = None
    phone: str | None = None
    valid_until: str | None = None


class OpcApplicationRequiredFieldRequest(BaseModel):
    field: str
    label: str
    required: bool = True


class OpcApplicationRequiredRequest(BaseModel):
    fields: list[OpcApplicationRequiredFieldRequest] = Field(default_factory=list)


class OpcApplicationPremisesSourceRequest(BaseModel):
    type: str
    material_file_ids: list[int] = Field(default_factory=list)
    community_join_application_id: int | None = None
    target_campus: str | None = None
    status: str | None = None
    submitted_at: str | None = None


class OpcApplicationSubmitRequest(BaseModel):
    company_name: str
    company_name_note: str | None = None
    company_name_alternative_one: str | None = None
    company_name_alternative_two: str | None = None
    name_combination_mode: str | None = None
    registered_capital: str
    currency: str = "人民币"
    business_scope: str
    premises_area: str | None = None
    property_owner: str | None = None
    property_contact_phone: str | None = None
    shareholder_one_type: str | None = None
    shareholder_one_name: str | None = None
    shareholder_one_id_no: str | None = None
    shareholder_one_subscribed_capital: str | None = None
    shareholder_one_equity_ratio: str | None = None
    shareholder_one_address: str | None = None
    shareholder_one_phone: str | None = None
    shareholder_one_valid_until: str | None = None
    shareholder_two_type: str | None = None
    shareholder_two_name: str | None = None
    shareholder_two_id_no: str | None = None
    shareholder_two_subscribed_capital: str | None = None
    shareholder_two_equity_ratio: str | None = None
    shareholder_two_address: str | None = None
    shareholder_two_phone: str | None = None
    shareholder_two_valid_until: str | None = None
    shareholders: list[OpcApplicationShareholderRequest] = Field(default_factory=list)
    legal_representative_name: str | None = None
    legal_representative_phone: str | None = None
    legal_representative_id_no: str | None = None
    legal_representative_address: str | None = None
    manager_name: str | None = None
    manager_phone: str | None = None
    manager_id_no: str | None = None
    manager_address: str | None = None
    finance_leader_name: str | None = None
    finance_leader_phone: str | None = None
    finance_leader_id_no: str | None = None
    finance_leader_address: str | None = None
    supervisor_name: str | None = None
    supervisor_phone: str | None = None
    supervisor_id_no: str | None = None
    supervisor_address: str | None = None
    industrial_contact_name: str | None = None
    industrial_contact_phone: str | None = None
    industrial_contact_id_no: str | None = None
    industrial_contact_address: str | None = None
    mailing_status: str = "待开发"
    material_file_ids: list[int] = Field(default_factory=list)
    required: OpcApplicationRequiredRequest = Field(default_factory=OpcApplicationRequiredRequest)
    form_snapshot_json: str | None = None
    premises_source: OpcApplicationPremisesSourceRequest | None = None


class OpcApplicationReviewRequest(BaseModel):
    status: str
    reject_reason: str | None = None
    user_visible_note: str | None = None
    internal_note: str | None = None


class OpcApplicationMaterialDeleteRequest(BaseModel):
    file_id: int


class OpcApplicationDraftMaterialRequest(BaseModel):
    id: int


class OpcApplicationDraftSaveRequest(BaseModel):
    form: dict[str, Any] = Field(default_factory=dict)
    shareholders: list[dict[str, Any]] = Field(default_factory=list)
    materials: dict[str, list[OpcApplicationDraftMaterialRequest]] = Field(default_factory=dict)


class OpcApplicationMissingMaterialsRequest(BaseModel):
    is_missing_materials: bool


class OpcApplicationExportRequest(BaseModel):
    application_ids: list[int] = Field(default_factory=list)
