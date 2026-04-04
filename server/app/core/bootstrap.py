from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, init_db
from app.core.default_resource_data import (
    DEFAULT_RESOURCE_CATEGORIES,
    DEFAULT_RESOURCE_ITEMS,
    DEFAULT_STAGE4_PAGE_SECTIONS,
)
from app.core.security import get_password_hash
from app.models import (
    AdminUser,
    ArticleCategory,
    NavigationItem,
    PageSection,
    ResourceCategory,
    ResourceItem,
    SiteSetting,
)

DEFAULT_LOGO_PATH = "/prototype-assets/opc-logo.png"
LEGACY_LOGO_PATHS = {
    "/prototype-assets/集团横板logo简称-01单色.png",
}


def ensure_core_data() -> None:
    init_db()
    _ensure_schema_columns()
    db = SessionLocal()
    try:
        _ensure_site_settings(db)
        _ensure_admin_user(db)
        _ensure_navigation_items(db)
        _ensure_article_categories(db)
        _ensure_stage4_page_sections(db)
        _ensure_resource_defaults(db)
        db.commit()
    finally:
        db.close()


def _ensure_schema_columns() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "feedbacks" not in table_names:
        return

    feedback_columns = {column["name"] for column in inspector.get_columns("feedbacks")}
    statements: list[str] = []
    if "site_user_id" not in feedback_columns:
        statements.append("ALTER TABLE feedbacks ADD COLUMN site_user_id INTEGER NULL")
    if "submitter_name" not in feedback_columns:
        statements.append("ALTER TABLE feedbacks ADD COLUMN submitter_name VARCHAR(64) NULL")

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def _ensure_site_settings(db: Session) -> None:
    item = db.query(SiteSetting).order_by(SiteSetting.id.asc()).first()
    if item is not None:
        if not item.logo_url or item.logo_url in LEGACY_LOGO_PATHS:
            item.logo_url = DEFAULT_LOGO_PATH
        return

    db.add(
        SiteSetting(
            site_name="厦门 OPC 社区门户",
            site_subtitle="成为一流的数智产业生态构建者",
            logo_url=DEFAULT_LOGO_PATH,
            footer_text="© 2026 厦门 OPC 社区. All rights reserved.",
            contact_phone="0592-5953016",
            contact_email="opc@xmigc.com",
            icp_no="闽ICP备2026000001号",
        )
    )


def _ensure_admin_user(db: Session) -> None:
    item = db.query(AdminUser).filter(AdminUser.username == "admin").first()
    if item is not None:
        return

    db.add(
        AdminUser(
            username="admin",
            password_hash=get_password_hash("Admin@123456"),
            name="系统管理员",
            status=1,
        )
    )


def _ensure_navigation_items(db: Session) -> None:
    default_items = [
        {"label": "首页", "path": "/", "target_type": "internal", "target_value": "/"},
        {"label": "最新动态", "path": "/news", "target_type": "internal", "target_value": "/news"},
        {"label": "社区简介", "path": "/community", "target_type": "internal", "target_value": "/community"},
        {"label": "创业服务", "path": "/services", "target_type": "internal", "target_value": "/services"},
        {"label": "资源集市", "path": "/marketplace", "target_type": "internal", "target_value": "/marketplace"},
        {"label": "意见反馈", "path": "/feedback", "target_type": "internal", "target_value": "/feedback"},
    ]

    existing = {item.path: item for item in db.query(NavigationItem).all()}
    for index, payload in enumerate(default_items, start=1):
        item = existing.get(payload["path"])
        if item is None:
            db.add(NavigationItem(**payload, sort_order=index, is_visible=1))


def _ensure_article_categories(db: Session) -> None:
    categories = [
        {"code": "activity", "name": "活动通知", "sort_order": 1},
        {"code": "policy", "name": "政策文件", "sort_order": 2},
        {"code": "article", "name": "文章信息", "sort_order": 3},
        {"code": "notice", "name": "申报通知", "sort_order": 4},
    ]
    existing_codes = {item.code for item in db.query(ArticleCategory).all()}
    for payload in categories:
        if payload["code"] in existing_codes:
            continue
        db.add(ArticleCategory(**payload, is_enabled=1))


def _ensure_stage4_page_sections(db: Session) -> None:
    existing_keys = {
        (item.page_key, item.section_key)
        for item in db.query(PageSection)
        .filter(PageSection.page_key.in_(["marketplace", "api_market", "mcp_market"]))
        .all()
    }
    for payload in DEFAULT_STAGE4_PAGE_SECTIONS:
        key = (payload["page_key"], payload["section_key"])
        if key in existing_keys:
            continue
        db.add(PageSection(**payload))


def _ensure_resource_defaults(db: Session) -> None:
    existing_categories = {item.code: item for item in db.query(ResourceCategory).all()}
    for payload in DEFAULT_RESOURCE_CATEGORIES:
        if payload["code"] in existing_categories:
            continue
        db.add(ResourceCategory(**payload))

    db.flush()

    categories_by_code = {item.code: item for item in db.query(ResourceCategory).all()}
    existing_item_keys = {
        (item.resource_type, item.category_id, item.title)
        for item in db.query(ResourceItem).all()
    }

    for payload in DEFAULT_RESOURCE_ITEMS:
        category = categories_by_code.get(payload["category_code"])
        if category is None:
            continue

        key = (payload["resource_type"], category.id, payload["title"])
        if key in existing_item_keys:
            continue

        item_payload = {
            "category_id": category.id,
            "resource_type": payload["resource_type"],
            "title": payload["title"],
            "summary": payload["summary"],
            "icon": payload.get("icon"),
            "image_url": payload.get("image_url"),
            "badge_text": payload.get("badge_text"),
            "price": payload.get("price"),
            "unit_label": payload.get("unit_label"),
            "status_text": payload.get("status_text"),
            "link_type": payload.get("link_type", "none"),
            "link_value": payload.get("link_value"),
            "tags_json": payload.get("tags_json"),
            "meta_json": payload.get("meta_json"),
            "sort_order": payload.get("sort_order", 0),
            "is_published": payload.get("is_published", 1),
        }
        db.add(ResourceItem(**item_payload))
