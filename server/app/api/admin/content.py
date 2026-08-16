import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token, get_password_hash
from app.models.admin_user import AdminUser
from app.models.article import Article
from app.models.article_category import ArticleCategory
from app.models.banner import Banner
from app.models.feedback import Feedback
from app.models.opc_application import OpcApplication
from app.models.opc_application_action_log import OpcApplicationActionLog
from app.models.opc_application_material_file import OpcApplicationMaterialFile
from app.models.opc_application_review_record import OpcApplicationReviewRecord
from app.models.page_section import PageSection
from app.models.resource_category import ResourceCategory
from app.models.resource_item import ResourceItem
from app.models.service_item import ServiceItem
from app.models.site_user import SiteUser
from app.models.site_setting import SiteSetting
from app.schemas.common import ApiResponse
from app.schemas.content import (
    ArticleCreateRequest,
    BannerCreateRequest,
    FeedbackUpdateRequest,
    PageSectionCreateRequest,
    ResourceCategoryCreateRequest,
    ResourceItemCreateRequest,
    ServiceItemCreateRequest,
    SiteUserUpdateRequest,
    SiteSettingsUpdateRequest,
)
from app.services.auth import validate_password, validate_site_user_name
from app.schemas.opc_application import (
    OpcApplicationDetailResponse,
    OpcApplicationExportResponse,
    OpcApplicationListItemResponse,
    OpcApplicationListResponse,
    OpcApplicationReviewRequest,
)



def require_admin_auth(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing authorization")

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid admin token")

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid access token")
    return str(subject)


router = APIRouter(dependencies=[Depends(require_admin_auth)])


@router.get("/site-settings", response_model=ApiResponse[dict])
def get_admin_site_settings(db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = db.query(SiteSetting).order_by(SiteSetting.id.asc()).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="site settings not found")
    return ApiResponse(data=_site_settings_to_dict(item))


@router.put("/site-settings", response_model=ApiResponse[dict])
def update_site_settings(payload: SiteSettingsUpdateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = db.query(SiteSetting).order_by(SiteSetting.id.asc()).first()
    if item is None:
        item = SiteSetting(**payload.model_dump())
        db.add(item)
    else:
        for key, value in payload.model_dump().items():
            setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_site_settings_to_dict(item))


@router.get("/banners", response_model=ApiResponse[list[dict]])
def list_banners(db: Session = Depends(get_db)) -> ApiResponse[list[dict]]:
    items = db.query(Banner).order_by(Banner.sort_order.asc(), Banner.id.asc()).all()
    return ApiResponse(data=[_banner_to_dict(item) for item in items])


@router.post("/banners", response_model=ApiResponse[dict])
def create_banner(payload: BannerCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = Banner(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_banner_to_dict(item))


@router.put("/banners/{item_id}", response_model=ApiResponse[dict])
def update_banner(item_id: int, payload: BannerCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, Banner, item_id, "banner not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_banner_to_dict(item))


@router.delete("/banners/{item_id}", response_model=ApiResponse[dict])
def delete_banner(item_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, Banner, item_id, "banner not found")
    db.delete(item)
    db.commit()
    return ApiResponse(data={"id": item_id})


@router.get("/articles", response_model=ApiResponse[list[dict]])
def list_articles(
    category_code: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(Article).join(ArticleCategory)
    if category_code:
        query = query.filter(ArticleCategory.code == category_code)
    items = query.order_by(Article.is_top.desc(), Article.sort_order.asc(), Article.publish_at.desc()).all()
    return ApiResponse(data=[_article_to_dict(item) for item in items])


@router.post("/articles", response_model=ApiResponse[dict])
def create_article(payload: ArticleCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    category = _get_category_by_code(db, payload.category_code)
    item = Article(
        category_id=category.id,
        title=payload.title,
        summary=payload.summary,
        link_type=payload.link_type,
        external_url=payload.external_url,
        publish_at=datetime.fromisoformat(payload.publish_at),
        source_name=payload.source_name,
        is_top=payload.is_top,
        is_published=payload.is_published,
        sort_order=payload.sort_order,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_article_to_dict(item))


@router.put("/articles/{item_id}", response_model=ApiResponse[dict])
def update_article(item_id: int, payload: ArticleCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, Article, item_id, "article not found")
    category = _get_category_by_code(db, payload.category_code)
    item.category_id = category.id
    item.title = payload.title
    item.summary = payload.summary
    item.link_type = payload.link_type
    item.external_url = payload.external_url
    item.publish_at = datetime.fromisoformat(payload.publish_at)
    item.source_name = payload.source_name
    item.is_top = payload.is_top
    item.is_published = payload.is_published
    item.sort_order = payload.sort_order
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_article_to_dict(item))


@router.delete("/articles/{item_id}", response_model=ApiResponse[dict])
def delete_article(item_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, Article, item_id, "article not found")
    db.delete(item)
    db.commit()
    return ApiResponse(data={"id": item_id})


@router.get("/service-items", response_model=ApiResponse[list[dict]])
def list_service_items(
    module_key: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(ServiceItem)
    if module_key:
        query = query.filter(ServiceItem.module_key == module_key)
    items = query.order_by(ServiceItem.sort_order.asc(), ServiceItem.id.asc()).all()
    return ApiResponse(data=[_service_item_to_dict(item) for item in items])


@router.post("/service-items", response_model=ApiResponse[dict])
def create_service_item(payload: ServiceItemCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = ServiceItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_service_item_to_dict(item))


@router.put("/service-items/{item_id}", response_model=ApiResponse[dict])
def update_service_item(
    item_id: int,
    payload: ServiceItemCreateRequest,
    db: Session = Depends(get_db),
) -> ApiResponse[dict]:
    item = _must_get(db, ServiceItem, item_id, "service item not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_service_item_to_dict(item))


@router.delete("/service-items/{item_id}", response_model=ApiResponse[dict])
def delete_service_item(item_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, ServiceItem, item_id, "service item not found")
    db.delete(item)
    db.commit()
    return ApiResponse(data={"id": item_id})


@router.get("/page-sections", response_model=ApiResponse[list[dict]])
def list_page_sections(
    page_key: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(PageSection)
    if page_key:
        query = query.filter(PageSection.page_key == page_key)
    items = query.order_by(PageSection.sort_order.asc(), PageSection.id.asc()).all()
    return ApiResponse(data=[_page_section_to_dict(item) for item in items])


@router.post("/page-sections", response_model=ApiResponse[dict])
def create_page_section(payload: PageSectionCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = PageSection(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_page_section_to_dict(item))


@router.put("/page-sections/{item_id}", response_model=ApiResponse[dict])
def update_page_section(
    item_id: int,
    payload: PageSectionCreateRequest,
    db: Session = Depends(get_db),
) -> ApiResponse[dict]:
    item = _must_get(db, PageSection, item_id, "page section not found")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_page_section_to_dict(item))


@router.delete("/page-sections/{item_id}", response_model=ApiResponse[dict])
def delete_page_section(item_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, PageSection, item_id, "page section not found")
    db.delete(item)
    db.commit()
    return ApiResponse(data={"id": item_id})


@router.get("/resource-categories", response_model=ApiResponse[list[dict]])
def list_resource_categories(
    resource_type: str | None = Query(default=None),
    group_key: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(ResourceCategory)
    if resource_type:
        query = query.filter(ResourceCategory.resource_type == resource_type)
    if group_key:
        query = query.filter(ResourceCategory.group_key == group_key)
    items = query.order_by(ResourceCategory.sort_order.asc(), ResourceCategory.id.asc()).all()
    return ApiResponse(data=[_resource_category_to_dict(item) for item in items])


@router.post("/resource-categories", response_model=ApiResponse[dict])
def create_resource_category(payload: ResourceCategoryCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    if db.query(ResourceCategory).filter(ResourceCategory.code == payload.code).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="resource category code already exists")
    item = ResourceCategory(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_resource_category_to_dict(item))


@router.put("/resource-categories/{item_id}", response_model=ApiResponse[dict])
def update_resource_category(
    item_id: int,
    payload: ResourceCategoryCreateRequest,
    db: Session = Depends(get_db),
) -> ApiResponse[dict]:
    item = _must_get(db, ResourceCategory, item_id, "resource category not found")
    existing = (
        db.query(ResourceCategory)
        .filter(ResourceCategory.code == payload.code, ResourceCategory.id != item_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="resource category code already exists")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_resource_category_to_dict(item))


@router.delete("/resource-categories/{item_id}", response_model=ApiResponse[dict])
def delete_resource_category(item_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, ResourceCategory, item_id, "resource category not found")
    db.query(ResourceItem).filter(ResourceItem.category_id == item.id).delete()
    db.delete(item)
    db.commit()
    return ApiResponse(data={"id": item_id})


@router.get("/resource-items", response_model=ApiResponse[list[dict]])
def list_resource_items(
    resource_type: str | None = Query(default=None),
    category_code: str | None = Query(default=None),
    group_key: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(ResourceItem).join(ResourceCategory)
    if resource_type:
        query = query.filter(ResourceItem.resource_type == resource_type)
    if category_code:
        query = query.filter(ResourceCategory.code == category_code)
    if group_key:
        query = query.filter(ResourceCategory.group_key == group_key)
    items = query.order_by(ResourceCategory.sort_order.asc(), ResourceItem.sort_order.asc(), ResourceItem.id.asc()).all()
    return ApiResponse(data=[_resource_item_to_dict(item) for item in items])


@router.post("/resource-items", response_model=ApiResponse[dict])
def create_resource_item(payload: ResourceItemCreateRequest, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    category = _get_resource_category_by_code(db, payload.category_code)
    if category.resource_type != payload.resource_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="resource type does not match category")
    _validate_json_field(payload.tags_json, "tags_json")
    _validate_json_field(payload.meta_json, "meta_json")
    item = ResourceItem(
        category_id=category.id,
        resource_type=payload.resource_type,
        title=payload.title,
        summary=payload.summary,
        icon=payload.icon,
        image_url=payload.image_url,
        badge_text=payload.badge_text,
        price=payload.price,
        unit_label=payload.unit_label,
        status_text=payload.status_text,
        link_type=payload.link_type,
        link_value=payload.link_value,
        primary_button_text=payload.primary_button_text,
        secondary_link_type=payload.secondary_link_type,
        secondary_link_value=payload.secondary_link_value,
        secondary_button_text=payload.secondary_button_text,
        tags_json=payload.tags_json,
        meta_json=payload.meta_json,
        show_on_home=payload.show_on_home,
        sort_order=payload.sort_order,
        is_published=payload.is_published,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_resource_item_to_dict(item))


@router.put("/resource-items/{item_id}", response_model=ApiResponse[dict])
def update_resource_item(
    item_id: int,
    payload: ResourceItemCreateRequest,
    db: Session = Depends(get_db),
) -> ApiResponse[dict]:
    item = _must_get(db, ResourceItem, item_id, "resource item not found")
    category = _get_resource_category_by_code(db, payload.category_code)
    if category.resource_type != payload.resource_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="resource type does not match category")
    _validate_json_field(payload.tags_json, "tags_json")
    _validate_json_field(payload.meta_json, "meta_json")
    item.category_id = category.id
    item.resource_type = payload.resource_type
    item.title = payload.title
    item.summary = payload.summary
    item.icon = payload.icon
    item.image_url = payload.image_url
    item.badge_text = payload.badge_text
    item.price = payload.price
    item.unit_label = payload.unit_label
    item.status_text = payload.status_text
    item.link_type = payload.link_type
    item.link_value = payload.link_value
    item.primary_button_text = payload.primary_button_text
    item.secondary_link_type = payload.secondary_link_type
    item.secondary_link_value = payload.secondary_link_value
    item.secondary_button_text = payload.secondary_button_text
    item.tags_json = payload.tags_json
    item.meta_json = payload.meta_json
    item.show_on_home = payload.show_on_home
    item.sort_order = payload.sort_order
    item.is_published = payload.is_published
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_resource_item_to_dict(item))


@router.delete("/resource-items/{item_id}", response_model=ApiResponse[dict])
def delete_resource_item(item_id: int, db: Session = Depends(get_db)) -> ApiResponse[dict]:
    item = _must_get(db, ResourceItem, item_id, "resource item not found")
    db.delete(item)
    db.commit()
    return ApiResponse(data={"id": item_id})


@router.get("/site-users", response_model=ApiResponse[list[dict]])
def list_site_users(
    keyword: str | None = Query(default=None),
    status_filter: int | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(SiteUser)
    if status_filter is not None:
        query = query.filter(SiteUser.status == status_filter)
    if keyword:
        like_keyword = f"%{keyword.strip()}%"
        query = query.filter((SiteUser.name.like(like_keyword)) | (SiteUser.phone.like(like_keyword)))
    items = query.order_by(SiteUser.created_at.desc(), SiteUser.id.desc()).all()
    return ApiResponse(data=[_site_user_to_dict(item) for item in items])


@router.put("/site-users/{item_id}", response_model=ApiResponse[dict])
def update_site_user(
    item_id: int,
    payload: SiteUserUpdateRequest,
    db: Session = Depends(get_db),
) -> ApiResponse[dict]:
    item = _must_get(db, SiteUser, item_id, "site user not found")
    try:
        item.name = validate_site_user_name(payload.name)
        if payload.password and payload.password.strip():
            item.password_hash = get_password_hash(validate_password(payload.password))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    item.status = 1 if payload.status == 1 else 0
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_site_user_to_dict(item))


@router.get("/feedbacks", response_model=ApiResponse[list[dict]])
def list_feedbacks(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> ApiResponse[list[dict]]:
    query = db.query(Feedback).filter(Feedback.is_deleted == 0)
    if status_filter:
        query = query.filter(Feedback.status == status_filter)
    items = query.order_by(Feedback.created_at.desc(), Feedback.id.desc()).all()
    return ApiResponse(data=[_feedback_to_dict(item) for item in items])


@router.put("/feedbacks/{item_id}", response_model=ApiResponse[dict])
def update_feedback(
    item_id: int,
    payload: FeedbackUpdateRequest,
    admin_username: str = Depends(require_admin_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[dict]:
    allowed_status = {"pending", "processing", "resolved", "rejected"}
    if payload.status not in allowed_status:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid feedback status")

    item = _must_get(db, Feedback, item_id, "feedback not found")
    item.status = payload.status
    item.admin_reply = (payload.admin_reply or "").strip() or None
    item.handled_by = admin_username
    item.handled_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return ApiResponse(data=_feedback_to_dict(item))


def _must_get(db: Session, model, item_id: int, message: str):
    item = db.query(model).filter(model.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    return item


def _get_category_by_code(db: Session, code: str) -> ArticleCategory:
    category = db.query(ArticleCategory).filter(ArticleCategory.code == code).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid category code")
    return category


def _get_resource_category_by_code(db: Session, code: str) -> ResourceCategory:
    category = db.query(ResourceCategory).filter(ResourceCategory.code == code).first()
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid resource category code")
    return category


def _validate_json_field(value: str | None, field_name: str) -> None:
    if not value:
        return
    try:
        json.loads(value)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{field_name} is not valid JSON") from exc


def _site_settings_to_dict(item: SiteSetting) -> dict:
    return {
        "site_name": item.site_name,
        "site_subtitle": item.site_subtitle,
        "logo_url": item.logo_url,
        "footer_text": item.footer_text,
        "contact_phone": item.contact_phone,
        "contact_email": item.contact_email,
        "icp_no": item.icp_no,
    }


def _banner_to_dict(item: Banner) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "subtitle": item.subtitle,
        "highlight_title": item.highlight_title,
        "description": item.description,
        "image_url": item.image_url,
        "action_type": item.action_type,
        "action_value": item.action_value,
        "sort_order": item.sort_order,
        "is_published": item.is_published,
    }


def _article_to_dict(item: Article) -> dict:
    return {
        "id": item.id,
        "category": {
            "id": item.category.id,
            "code": item.category.code,
            "name": item.category.name,
        },
        "title": item.title,
        "summary": item.summary,
        "link_type": item.link_type,
        "external_url": item.external_url,
        "publish_at": item.publish_at.isoformat(),
        "source_name": item.source_name,
        "is_top": bool(item.is_top),
        "is_published": item.is_published,
        "sort_order": item.sort_order,
    }


def _service_item_to_dict(item: ServiceItem) -> dict:
    return {
        "id": item.id,
        "module_key": item.module_key,
        "title": item.title,
        "summary": item.summary,
        "icon": item.icon,
        "target_type": item.target_type,
        "target_value": item.target_value,
        "sort_order": item.sort_order,
        "is_published": item.is_published,
    }


def _page_section_to_dict(item: PageSection) -> dict:
    return {
        "id": item.id,
        "page_key": item.page_key,
        "section_key": item.section_key,
        "title": item.title,
        "subtitle": item.subtitle,
        "content": item.content,
        "extra_json": item.extra_json,
        "sort_order": item.sort_order,
        "is_published": item.is_published,
    }


def _resource_category_to_dict(item: ResourceCategory) -> dict:
    return {
        "id": item.id,
        "code": item.code,
        "name": item.name,
        "resource_type": item.resource_type,
        "group_key": item.group_key,
        "description": item.description,
        "icon": item.icon,
        "image_url": item.image_url,
        "display_template": item.display_template,
        "action_type": item.action_type,
        "action_value": item.action_value,
        "button_text": item.button_text,
        "show_on_home": item.show_on_home,
        "sort_order": item.sort_order,
        "is_published": item.is_published,
    }


def _resource_item_to_dict(item: ResourceItem) -> dict:
    return {
        "id": item.id,
        "resource_type": item.resource_type,
        "category": _resource_category_to_dict(item.category),
        "title": item.title,
        "summary": item.summary,
        "icon": item.icon,
        "image_url": item.image_url,
        "badge_text": item.badge_text,
        "price": item.price,
        "unit_label": item.unit_label,
        "status_text": item.status_text,
        "link_type": item.link_type,
        "link_value": item.link_value,
        "primary_button_text": item.primary_button_text,
        "secondary_link_type": item.secondary_link_type,
        "secondary_link_value": item.secondary_link_value,
        "secondary_button_text": item.secondary_button_text,
        "tags_json": item.tags_json,
        "meta_json": item.meta_json,
        "show_on_home": item.show_on_home,
        "sort_order": item.sort_order,
        "is_published": item.is_published,
    }


def _site_user_to_dict(item: SiteUser) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "real_name": item.real_name,
        "phone": item.phone,
        "mobile_fuzzy": item.mobile_fuzzy,
        "auth_source": item.auth_source,
        "external_open_id": item.external_open_id,
        "status": item.status,
        "last_login_at": item.last_login_at.isoformat() if item.last_login_at else None,
        "created_at": item.created_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }


def _feedback_to_dict(item: Feedback) -> dict:
    return {
        "id": item.id,
        "site_user_id": item.site_user_id,
        "submitter_name": item.submitter_name,
        "subject": item.subject,
        "content": item.content,
        "phone": item.phone,
        "attachment_name": item.attachment_name,
        "attachment_url": item.attachment_url,
        "status": item.status,
        "admin_reply": item.admin_reply,
        "handled_by": item.handled_by,
        "handled_at": item.handled_at.isoformat() if item.handled_at else None,
        "created_at": item.created_at.isoformat(),
        "updated_at": item.updated_at.isoformat(),
    }
