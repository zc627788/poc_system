from pydantic import BaseModel


class CommunityJoinApplyRequest(BaseModel):
    target_campus: str


class CommunityJoinApplyResponse(BaseModel):
    id: int
    target_campus: str
    status: str
    submitted_at: str


class CommunityJoinMaterialFileItem(BaseModel):
    id: int
    application_id: int
    original_file_name: str
    storage_path: str
    file_type: str
    file_size: int
    is_deleted: bool
    uploaded_at: str


class CommunityJoinActionLogItem(BaseModel):
    id: int
    action_type: str
    action_summary: str
    action_detail: str | None = None
    operated_by_name: str | None = None
    operated_at: str


class CommunityJoinApplicationListItem(BaseModel):
    id: int
    site_user_id: int
    site_user_name: str | None = None
    site_user_phone: str | None = None
    target_campus: str
    status: str
    material_count: int
    submitted_at: str
    updated_at: str


class CommunityJoinApplicationListResponse(BaseModel):
    items: list[CommunityJoinApplicationListItem]
    total: int
    page: int
    page_size: int


class MergeChunksRequest(BaseModel):
    upload_id: str
    file_name: str
    total_chunks: int


class CommunityJoinApplicationDetailResponse(BaseModel):
    id: int
    site_user_id: int
    site_user_name: str | None = None
    site_user_phone: str | None = None
    target_campus: str
    status: str
    submitted_at: str
    updated_at: str
    materials: list[CommunityJoinMaterialFileItem]
    action_logs: list[CommunityJoinActionLogItem]
