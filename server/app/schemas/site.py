from pydantic import BaseModel


class SiteSettingsResponse(BaseModel):
    site_name: str
    site_subtitle: str
    logo_url: str | None = None
    footer_text: str
    contact_phone: str | None = None
    contact_email: str | None = None
    icp_no: str | None = None


class NavigationItemResponse(BaseModel):
    id: int
    label: str
    path: str
    target_type: str
    target_value: str
    sort_order: int


class BannerResponse(BaseModel):
    id: int
    title: str
    subtitle: str
    highlight_title: str
    description: str
    image_url: str
    action_type: str
    action_value: str | None = None
    sort_order: int


class ArticleCategoryResponse(BaseModel):
    id: int
    code: str
    name: str


class ArticleResponse(BaseModel):
    id: int
    category: ArticleCategoryResponse
    title: str
    summary: str
    link_type: str
    external_url: str | None = None
    publish_at: str
    source_name: str | None = None
    is_top: bool


class ServiceItemResponse(BaseModel):
    id: int
    module_key: str
    title: str
    summary: str
    icon: str | None = None
    target_type: str
    target_value: str | None = None
    sort_order: int


class PageSectionResponse(BaseModel):
    id: int
    page_key: str
    section_key: str
    title: str
    subtitle: str | None = None
    content: str
    extra_json: str | None = None
    sort_order: int


class ResourceCategoryResponse(BaseModel):
    id: int
    code: str
    name: str
    resource_type: str
    group_key: str | None = None
    description: str
    icon: str | None = None
    action_type: str
    action_value: str | None = None
    button_text: str | None = None
    sort_order: int


class ResourceItemResponse(BaseModel):
    id: int
    category: ResourceCategoryResponse
    resource_type: str
    title: str
    summary: str
    icon: str | None = None
    image_url: str | None = None
    badge_text: str | None = None
    price: str | None = None
    unit_label: str | None = None
    status_text: str | None = None
    link_type: str
    link_value: str | None = None
    tags: list[str]
    meta: dict
    sort_order: int


class FeedbackSubmitRequest(BaseModel):
    subject: str
    content: str
    phone: str
    attachment_name: str | None = None
    attachment_url: str | None = None


class FeedbackSubmitResponse(BaseModel):
    id: int
    status: str
