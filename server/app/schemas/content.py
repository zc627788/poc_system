from pydantic import BaseModel


class SiteSettingsUpdateRequest(BaseModel):
    site_name: str
    site_subtitle: str
    logo_url: str | None = None
    footer_text: str
    contact_phone: str | None = None
    contact_email: str | None = None
    icp_no: str | None = None


class BannerCreateRequest(BaseModel):
    title: str
    subtitle: str
    highlight_title: str
    description: str
    image_url: str
    action_type: str = "none"
    action_value: str | None = None
    sort_order: int = 0
    is_published: int = 1


class ArticleCreateRequest(BaseModel):
    category_code: str
    title: str
    summary: str = ""
    link_type: str = "external"
    external_url: str | None = None
    publish_at: str
    source_name: str | None = None
    is_top: int = 0
    is_published: int = 1
    sort_order: int = 0


class ServiceItemCreateRequest(BaseModel):
    module_key: str
    title: str
    summary: str = ""
    icon: str | None = None
    target_type: str = "internal"
    target_value: str | None = None
    sort_order: int = 0
    is_published: int = 1


class PageSectionCreateRequest(BaseModel):
    page_key: str
    section_key: str
    title: str
    subtitle: str | None = None
    content: str = ""
    extra_json: str | None = None
    sort_order: int = 0
    is_published: int = 1


class ResourceCategoryCreateRequest(BaseModel):
    code: str
    name: str
    resource_type: str
    group_key: str | None = None
    description: str = ""
    icon: str | None = None
    action_type: str = "none"
    action_value: str | None = None
    button_text: str | None = None
    sort_order: int = 0
    is_published: int = 1


class ResourceItemCreateRequest(BaseModel):
    resource_type: str
    category_code: str
    title: str
    summary: str = ""
    icon: str | None = None
    image_url: str | None = None
    badge_text: str | None = None
    price: str | None = None
    unit_label: str | None = None
    status_text: str | None = None
    link_type: str = "none"
    link_value: str | None = None
    tags_json: str | None = None
    meta_json: str | None = None
    sort_order: int = 0
    is_published: int = 1


class FeedbackUpdateRequest(BaseModel):
    status: str
    admin_reply: str | None = None


class SiteUserUpdateRequest(BaseModel):
    name: str
    status: int
    password: str | None = None
