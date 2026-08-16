import json

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.article import Article
from app.models.article_category import ArticleCategory
from app.models.banner import Banner
from app.models.feedback import Feedback
from app.models.navigation_item import NavigationItem
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
from app.schemas.site import (
    ArticleCategoryResponse,
    ArticleResponse,
    BannerResponse,
    HomeMarketplaceGroupResponse,
    HomeMarketplaceSummaryResponse,
    NavigationItemResponse,
    PageSectionResponse,
    FeedbackSubmitRequest,
    FeedbackSubmitResponse,
    ResourceCategoryResponse,
    ResourceItemResponse,
    ServiceItemResponse,
    SiteSettingsResponse,
)
from app.services.auth import validate_phone


router = APIRouter()

HOME_MARKETPLACE_GROUPS = [
    {"key": "data", "section_key": "marketplace_group_data"},
    {"key": "tools", "section_key": "marketplace_group_tools"},
    {"key": "compute", "section_key": "marketplace_group_compute"},
]


@router.get("/site-settings", response_model=ApiResponse[SiteSettingsResponse])
def get_site_settings(db: Session = Depends(get_db)) -> ApiResponse[SiteSettingsResponse]:
    item = db.query(SiteSetting).order_by(SiteSetting.id.asc()).first()
    if item is None:
        data = SiteSettingsResponse(
            site_name="厦门 OPC 社区门户",
            site_subtitle="成为一流的数智产业生态构建者",
            logo_url="/site-logo-opc-community.png",
            footer_text="© 2026 厦门 OPC 社区. All rights reserved.",
            contact_phone="0592-5953016",
            contact_email="opc@xmigc.com",
            icp_no="闽ICP备2026000001号",
        )
        return ApiResponse(data=data)

    return ApiResponse(
        data=SiteSettingsResponse(
            site_name=item.site_name,
            site_subtitle=item.site_subtitle,
            logo_url=item.logo_url,
            footer_text=item.footer_text,
            contact_phone=item.contact_phone,
            contact_email=item.contact_email,
            icp_no=item.icp_no,
        )
    )


@router.get("/navigation", response_model=ApiResponse[list[NavigationItemResponse]])
def get_navigation(db: Session = Depends(get_db)) -> ApiResponse[list[NavigationItemResponse]]:
    items = (
        db.query(NavigationItem)
        .filter(NavigationItem.is_visible == 1)
        .order_by(NavigationItem.sort_order.asc(), NavigationItem.id.asc())
        .all()
    )
    return ApiResponse(
        data=[
            NavigationItemResponse(
                id=item.id,
                label=item.label,
                path=item.path,
                target_type=item.target_type,
                target_value=item.target_value,
                sort_order=item.sort_order,
            )
            for item in items
        ]
    )


@router.get("/banners", response_model=ApiResponse[list[BannerResponse]])
def get_banners(db: Session = Depends(get_db)) -> ApiResponse[list[BannerResponse]]:
    items = (
        db.query(Banner)
        .filter(Banner.is_published == 1)
        .order_by(Banner.sort_order.asc(), Banner.id.asc())
        .all()
    )
    return ApiResponse(
        data=[
            BannerResponse(
                id=item.id,
                title=item.title,
                subtitle=item.subtitle,
                highlight_title=item.highlight_title,
                description=item.description,
                image_url=item.image_url,
                action_type=item.action_type,
                action_value=item.action_value,
                sort_order=item.sort_order,
            )
            for item in items
        ]
    )


@router.get("/articles", response_model=ApiResponse[list[ArticleResponse]])
def get_articles(
    category_code: str | None = Query(default=None),
    limit: int = Query(default=6, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ApiResponse[list[ArticleResponse]]:
    query = db.query(Article).join(ArticleCategory).filter(Article.is_published == 1)
    if category_code:
        query = query.filter(ArticleCategory.code == category_code)
    items = (
        query.order_by(Article.is_top.desc(), Article.sort_order.asc(), Article.publish_at.desc())
        .limit(limit)
        .all()
    )
    return ApiResponse(
        data=[
            ArticleResponse(
                id=item.id,
                category=ArticleCategoryResponse(
                    id=item.category.id,
                    code=item.category.code,
                    name=item.category.name,
                ),
                title=item.title,
                summary=item.summary,
                link_type=item.link_type,
                external_url=item.external_url,
                publish_at=item.publish_at.date().isoformat(),
                source_name=item.source_name,
                is_top=bool(item.is_top),
            )
            for item in items
        ]
    )


@router.get("/service-items", response_model=ApiResponse[list[ServiceItemResponse]])
def get_service_items(
    module_key: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[ServiceItemResponse]]:
    query = db.query(ServiceItem).filter(ServiceItem.is_published == 1)
    if module_key:
        query = query.filter(ServiceItem.module_key == module_key)
    items = query.order_by(ServiceItem.sort_order.asc(), ServiceItem.id.asc()).all()
    return ApiResponse(
        data=[
            ServiceItemResponse(
                id=item.id,
                module_key=item.module_key,
                title=item.title,
                summary=item.summary,
                icon=item.icon,
                target_type=item.target_type,
                target_value=item.target_value,
                sort_order=item.sort_order,
            )
            for item in items
        ]
    )


@router.get("/page-sections/{page_key}", response_model=ApiResponse[list[PageSectionResponse]])
def get_page_sections(page_key: str, db: Session = Depends(get_db)) -> ApiResponse[list[PageSectionResponse]]:
    items = (
        db.query(PageSection)
        .filter(PageSection.page_key == page_key, PageSection.is_published == 1)
        .order_by(PageSection.sort_order.asc(), PageSection.id.asc())
        .all()
    )
    return ApiResponse(data=[response for item in items if (response := _page_section_to_response(item)) is not None])


@router.get("/resource-categories", response_model=ApiResponse[list[ResourceCategoryResponse]])
def get_resource_categories(
    resource_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[ResourceCategoryResponse]]:
    query = db.query(ResourceCategory).filter(ResourceCategory.is_published == 1)
    if resource_type:
        query = query.filter(ResourceCategory.resource_type == resource_type)
    items = query.order_by(ResourceCategory.sort_order.asc(), ResourceCategory.id.asc()).all()
    return ApiResponse(data=[_resource_category_to_response(item) for item in items])


@router.get("/resource-items", response_model=ApiResponse[list[ResourceItemResponse]])
def get_resource_items(
    resource_type: str | None = Query(default=None),
    category_code: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[ResourceItemResponse]]:
    query = db.query(ResourceItem).join(ResourceCategory).filter(ResourceItem.is_published == 1)
    if resource_type:
        query = query.filter(ResourceItem.resource_type == resource_type)
    if category_code:
        query = query.filter(ResourceCategory.code == category_code)
    items = query.order_by(ResourceCategory.sort_order.asc(), ResourceItem.sort_order.asc(), ResourceItem.id.asc()).all()
    return ApiResponse(data=[_resource_item_to_response(item) for item in items])


@router.get("/home-marketplace-summary", response_model=ApiResponse[HomeMarketplaceSummaryResponse])
def get_home_marketplace_summary(db: Session = Depends(get_db)) -> ApiResponse[HomeMarketplaceSummaryResponse]:
    section_keys = ["marketplace_summary", *[item["section_key"] for item in HOME_MARKETPLACE_GROUPS]]
    sections = (
        db.query(PageSection)
        .filter(
            PageSection.page_key == "home",
            PageSection.section_key.in_(section_keys),
            PageSection.is_published == 1,
        )
        .all()
    )
    sections_by_key = {item.section_key: item for item in sections}

    categories = (
        db.query(ResourceCategory)
        .filter(
            ResourceCategory.resource_type == "marketplace",
            ResourceCategory.is_published == 1,
            ResourceCategory.show_on_home == 1,
        )
        .order_by(ResourceCategory.group_key.asc(), ResourceCategory.sort_order.asc(), ResourceCategory.id.asc())
        .all()
    )
    items = (
        db.query(ResourceItem)
        .join(ResourceCategory)
        .filter(
            ResourceItem.resource_type == "marketplace",
            ResourceItem.is_published == 1,
            ResourceItem.show_on_home == 1,
            ResourceCategory.is_published == 1,
            ResourceCategory.show_on_home == 1,
        )
        .order_by(ResourceCategory.sort_order.asc(), ResourceItem.sort_order.asc(), ResourceItem.id.asc())
        .all()
    )

    groups: list[HomeMarketplaceGroupResponse] = []
    for group in HOME_MARKETPLACE_GROUPS:
        key = group["key"]
        groups.append(
            HomeMarketplaceGroupResponse(
                key=key,
                section=_page_section_to_response(sections_by_key.get(group["section_key"])),
                categories=[_resource_category_to_response(item) for item in categories if item.group_key == key],
                items=[_resource_item_to_response(item) for item in items if item.category.group_key == key],
            )
        )

    return ApiResponse(
        data=HomeMarketplaceSummaryResponse(
            summary=_page_section_to_response(sections_by_key.get("marketplace_summary")),
            groups=groups,
        )
    )


def _resource_category_to_response(item: ResourceCategory) -> ResourceCategoryResponse:
    return ResourceCategoryResponse(
        id=item.id,
        code=item.code,
        name=item.name,
        resource_type=item.resource_type,
        group_key=item.group_key,
        description=item.description,
        icon=item.icon,
        image_url=item.image_url,
        display_template=item.display_template,
        action_type=item.action_type,
        action_value=item.action_value,
        button_text=item.button_text,
        show_on_home=item.show_on_home,
        sort_order=item.sort_order,
    )


def _resource_item_to_response(item: ResourceItem) -> ResourceItemResponse:
    return ResourceItemResponse(
        id=item.id,
        category=_resource_category_to_response(item.category),
        resource_type=item.resource_type,
        title=item.title,
        summary=item.summary,
        icon=item.icon,
        image_url=item.image_url,
        badge_text=item.badge_text,
        price=item.price,
        unit_label=item.unit_label,
        status_text=item.status_text,
        link_type=item.link_type,
        link_value=item.link_value,
        primary_button_text=item.primary_button_text,
        secondary_link_type=item.secondary_link_type,
        secondary_link_value=item.secondary_link_value,
        secondary_button_text=item.secondary_button_text,
        tags=_parse_json_list(item.tags_json),
        meta=_parse_json_object(item.meta_json),
        show_on_home=item.show_on_home,
        sort_order=item.sort_order,
    )


def _page_section_to_response(item: PageSection | None) -> PageSectionResponse | None:
    if item is None:
        return None

    return PageSectionResponse(
        id=item.id,
        page_key=item.page_key,
        section_key=item.section_key,
        title=item.title,
        subtitle=item.subtitle,
        content=item.content,
        extra_json=item.extra_json,
        sort_order=item.sort_order,
    )


def _parse_json_list(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        data = json.loads(value)
    except json.JSONDecodeError:
        return []
    if isinstance(data, list):
        return [str(item) for item in data]
    return []


def _parse_json_object(value: str | None) -> dict:
    if not value:
        return {}
    try:
        data = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


@router.post("/feedbacks", response_model=ApiResponse[FeedbackSubmitResponse])
def submit_feedback(
    payload: FeedbackSubmitRequest,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[FeedbackSubmitResponse]:
    subject = payload.subject.strip()
    content = payload.content.strip()
    current_site_user = _get_optional_site_user(authorization, db)
    phone = current_site_user.phone if current_site_user else payload.phone.strip()

    if not subject:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="subject is required")
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="content is required")
    try:
        phone = validate_phone(phone)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    item = Feedback(
        site_user_id=current_site_user.id if current_site_user else None,
        submitter_name=current_site_user.name if current_site_user else None,
        subject=subject[:64],
        content=content,
        phone=phone[:32],
        attachment_name=(payload.attachment_name or "").strip() or None,
        attachment_url=(payload.attachment_url or "").strip() or None,
        status="pending",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ApiResponse(data=FeedbackSubmitResponse(id=item.id, status=item.status))


def _get_optional_site_user(authorization: str | None, db: Session) -> SiteUser | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
    except ValueError:
        return None

    if payload.get("role") != "site_user":
        return None

    subject = payload.get("sub")
    if not subject or not str(subject).isdigit():
        return None

    return db.query(SiteUser).filter(SiteUser.id == int(subject), SiteUser.status == 1).first()
