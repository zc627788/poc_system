from pydantic import BaseModel, Field


class OpcMaterialUploadItem(BaseModel):
    id: int
    application_id: int | None = None
    site_user_id: int
    material_category: str
    original_file_name: str
    storage_path: str
    file_type: str
    file_size: int
    uploaded_at: str
    is_deleted: bool = False


class OpcApplicationSubmitResponse(BaseModel):
    id: int
    application_no: str
    status: str
    submitted_at: str


class OpcApplicationDraftData(BaseModel):
    form: dict
    shareholders: list[dict]
    materials: dict[str, list[OpcMaterialUploadItem]]
    updated_at: str


class OpcApplicationDraftResponse(BaseModel):
    draft: OpcApplicationDraftData | None = None


class OpcApplicationDraftSaveResponse(BaseModel):
    ok: bool
    updated_at: str | None = None


class OpcApplicationDraftClearResponse(BaseModel):
    ok: bool


class OpcApplicationReviewRecordResponse(BaseModel):
    id: int
    previous_status: str | None = None
    current_status: str
    reject_reason: str | None = None
    user_visible_note: str | None = None
    internal_note: str | None = None
    operated_by_admin_user_id: int
    operated_by_name: str | None = None
    operated_at: str


class OpcApplicationActionLogResponse(BaseModel):
    id: int
    material_file_id: int | None = None
    action_type: str
    action_target: str | None = None
    action_summary: str
    action_detail: str | None = None
    operated_by_admin_user_id: int | None = None
    operated_by_site_user_id: int | None = None
    operated_by_name: str | None = None
    operated_at: str


class OpcApplicationListItemResponse(BaseModel):
    id: int
    application_no: str
    site_user_id: int
    site_user_name: str | None = None
    site_user_phone: str | None = None
    service_type: str = "OPC工商注册资料登记"
    company_name: str
    registered_capital: str
    business_scope: str
    submit_content: str
    status: str
    mailing_status: str
    mailing_contact_info: str | None = None
    is_missing_materials: bool
    reject_reason_summary: str | None = None
    submitted_at: str
    reviewed_at: str | None = None
    updated_at: str


class OpcApplicationListResponse(BaseModel):
    items: list[OpcApplicationListItemResponse]
    total: int
    page: int
    page_size: int


class OpcApplicationShareholderResponse(BaseModel):
    type: str | None = None
    name: str | None = None
    id_no: str | None = None
    subscribed_capital: str | None = None
    equity_ratio: str | None = None
    address: str | None = None
    phone: str | None = None
    valid_until: str | None = None


class OpcApplicationDetailResponse(BaseModel):
    id: int
    application_no: str
    site_user_id: int
    site_user_name: str | None = None
    site_user_phone: str | None = None
    source_module: str
    status: str
    is_missing_materials: bool
    submitted_at: str
    reviewed_at: str | None = None
    latest_status_at: str
    company_name: str
    company_name_note: str | None = None
    company_name_alternative_one: str | None = None
    company_name_alternative_two: str | None = None
    registered_capital: str
    currency: str
    business_scope: str
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
    shareholders_json: str | None = None
    shareholders: list[OpcApplicationShareholderResponse] = Field(default_factory=list)
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
    mailing_status: str
    form_snapshot_json: str | None = None
    premises_source_json: str | None = None
    materials: list[OpcMaterialUploadItem]
    review_records: list[OpcApplicationReviewRecordResponse]
    action_logs: list[OpcApplicationActionLogResponse]
    created_at: str
    updated_at: str


class OpcApplicationExportRow(BaseModel):
    application_no: str
    submitter_name: str | None = None
    submitter_phone: str | None = None
    company_name: str
    status: str
    is_missing_materials: str
    latest_updated_at: str
    created_at: str
    form_fields: dict[str, str | None] = Field(default_factory=dict)


class OpcApplicationExportResponse(BaseModel):
    rows: list[OpcApplicationExportRow]
