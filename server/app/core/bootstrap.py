from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, init_db
from app.core.default_resource_data import (
    DEFAULT_PAGE_SECTION_UPSERTS,
    DEFAULT_RESOURCE_CATEGORIES,
    DEFAULT_RESOURCE_CATEGORY_PATCHES,
    DEFAULT_RESOURCE_ITEMS,
    DEFAULT_RESOURCE_ITEM_PATCHES,
    DEFAULT_STAGE4_PAGE_SECTIONS,
)
from app.core.security import get_password_hash
from app.models import (
    AdminUser,
    ArticleCategory,
    Banner,
    NavigationItem,
    PageSection,
    ResourceCategory,
    ResourceItem,
    ServiceItem,
    SiteSetting,
)

DEFAULT_LOGO_PATH = "/site-logo-opc-community.png"
LEGACY_LOGO_PATHS = {
    "/prototype-assets/集团横板logo简称-01单色.png",
    "/prototype-assets/opc-logo.png",
    "/opc-community-mark.png",
    "/site-header-opc-logo.png",
}
SETUP_HERO_TITLE = "OPC工商注册全流程指引"
DEFAULT_BANNER_IMAGE_MAP = {
    "AI 黑客松大赛": "/home-banner-ai-hackathon.webp",
    "AI 火炬系列活动": "/home-banner-ai-torch-series.webp",
    "厦门OPC社区空间": "/home-banner-opc-community-space.webp",
}
DEFAULT_SERVICE_ICON_MAP = {
    "OPC工商注册": "/home-service-business-registration.png",
    "政策匹配": "/home-service-policy-matching.png",
    "安居落户": "/home-service-settlement-support.png",
    "融资对接": "/home-service-financing-connection.png",
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
        _ensure_setup_hero_title(db)
        _ensure_home_banners(db)
        _ensure_home_service_items(db)
        _ensure_resource_defaults(db)
        _remove_retired_resource_items(db)
        db.commit()
    finally:
        db.close()


def _ensure_schema_columns() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    statements: list[str] = []

    if "feedbacks" in table_names:
        feedback_columns = {column["name"] for column in inspector.get_columns("feedbacks")}
        if "site_user_id" not in feedback_columns:
            statements.append("ALTER TABLE feedbacks ADD COLUMN site_user_id INTEGER NULL")
        if "submitter_name" not in feedback_columns:
            statements.append("ALTER TABLE feedbacks ADD COLUMN submitter_name VARCHAR(64) NULL")

    if "resource_categories" in table_names:
        resource_category_columns = {column["name"] for column in inspector.get_columns("resource_categories")}
        if "image_url" not in resource_category_columns:
            statements.append("ALTER TABLE resource_categories ADD COLUMN image_url VARCHAR(500) NULL")
        if "display_template" not in resource_category_columns:
            statements.append(
                "ALTER TABLE resource_categories ADD COLUMN display_template VARCHAR(32) NOT NULL DEFAULT 'default'"
            )
        if "show_on_home" not in resource_category_columns:
            statements.append(
                "ALTER TABLE resource_categories ADD COLUMN show_on_home SMALLINT NOT NULL DEFAULT 1"
            )

    if "resource_items" in table_names:
        resource_item_columns = {column["name"] for column in inspector.get_columns("resource_items")}
        if "primary_button_text" not in resource_item_columns:
            statements.append("ALTER TABLE resource_items ADD COLUMN primary_button_text VARCHAR(100) NULL")
        if "secondary_link_type" not in resource_item_columns:
            statements.append(
                "ALTER TABLE resource_items ADD COLUMN secondary_link_type VARCHAR(32) NOT NULL DEFAULT 'none'"
            )
        if "secondary_link_value" not in resource_item_columns:
            statements.append("ALTER TABLE resource_items ADD COLUMN secondary_link_value VARCHAR(500) NULL")
        if "secondary_button_text" not in resource_item_columns:
            statements.append("ALTER TABLE resource_items ADD COLUMN secondary_button_text VARCHAR(100) NULL")
        if "show_on_home" not in resource_item_columns:
            statements.append("ALTER TABLE resource_items ADD COLUMN show_on_home SMALLINT NOT NULL DEFAULT 1")

    if "site_users" in table_names:
        site_user_columns = {column["name"] for column in inspector.get_columns("site_users")}
        site_user_indexes = {index["name"] for index in inspector.get_indexes("site_users")}
        if "real_name" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN real_name VARCHAR(64) NULL")
        if "auth_source" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN auth_source VARCHAR(32) NOT NULL DEFAULT 'local'")
        if "external_open_id" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN external_open_id VARCHAR(128) NULL")
        if "external_user_id" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN external_user_id VARCHAR(128) NULL")
        if "user_type" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN user_type INTEGER NULL")
        if "mobile_fuzzy" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN mobile_fuzzy VARCHAR(32) NULL")
        if "raw_profile_json" not in site_user_columns:
            statements.append("ALTER TABLE site_users ADD COLUMN raw_profile_json TEXT NULL")
        if "ix_site_users_external_open_id" not in site_user_indexes and "external_open_id" in (
            site_user_columns | {"external_open_id"}
        ):
            statements.append(
                "CREATE UNIQUE INDEX ix_site_users_external_open_id ON site_users (external_open_id)"
            )

    if "opc_applications" in table_names:
        opc_columns = {column["name"] for column in inspector.get_columns("opc_applications")}
        opc_add_columns = [
            ("manager_phone", "ALTER TABLE opc_applications ADD COLUMN manager_phone VARCHAR(32) NULL"),
            ("manager_id_no", "ALTER TABLE opc_applications ADD COLUMN manager_id_no VARCHAR(128) NULL"),
            ("manager_address", "ALTER TABLE opc_applications ADD COLUMN manager_address VARCHAR(255) NULL"),
            ("finance_leader_phone", "ALTER TABLE opc_applications ADD COLUMN finance_leader_phone VARCHAR(32) NULL"),
            ("finance_leader_id_no", "ALTER TABLE opc_applications ADD COLUMN finance_leader_id_no VARCHAR(128) NULL"),
            ("finance_leader_address", "ALTER TABLE opc_applications ADD COLUMN finance_leader_address VARCHAR(255) NULL"),
            ("supervisor_phone", "ALTER TABLE opc_applications ADD COLUMN supervisor_phone VARCHAR(32) NULL"),
            ("supervisor_id_no", "ALTER TABLE opc_applications ADD COLUMN supervisor_id_no VARCHAR(128) NULL"),
            ("supervisor_address", "ALTER TABLE opc_applications ADD COLUMN supervisor_address VARCHAR(255) NULL"),
            ("industrial_contact_phone", "ALTER TABLE opc_applications ADD COLUMN industrial_contact_phone VARCHAR(32) NULL"),
            ("industrial_contact_id_no", "ALTER TABLE opc_applications ADD COLUMN industrial_contact_id_no VARCHAR(128) NULL"),
            ("industrial_contact_address", "ALTER TABLE opc_applications ADD COLUMN industrial_contact_address VARCHAR(255) NULL"),
            ("shareholders_json", "ALTER TABLE opc_applications ADD COLUMN shareholders_json TEXT NULL"),
            (
                "company_name_alternative_one",
                "ALTER TABLE opc_applications ADD COLUMN company_name_alternative_one VARCHAR(255) NULL",
            ),
            (
                "company_name_alternative_two",
                "ALTER TABLE opc_applications ADD COLUMN company_name_alternative_two VARCHAR(255) NULL",
            ),
            (
                "mailing_status",
                "ALTER TABLE opc_applications ADD COLUMN mailing_status VARCHAR(32) NOT NULL DEFAULT '待开发'",
            ),
            ("form_snapshot_json", "ALTER TABLE opc_applications ADD COLUMN form_snapshot_json TEXT NULL"),
            ("premises_source_json", "ALTER TABLE opc_applications ADD COLUMN premises_source_json TEXT NULL"),
            (
                "application_form_payload_json",
                "ALTER TABLE opc_applications ADD COLUMN application_form_payload_json TEXT NULL",
            ),
        ]
        for column_name, statement in opc_add_columns:
            if column_name not in opc_columns:
                statements.append(statement)

    if "opc_application_material_files" in table_names:
        statements.append(
            "UPDATE opc_application_material_files "
            "SET material_category = '执行董事（法定代表人）、监事、经理、财务负责人、联络人身份证' "
            "WHERE material_category = '执行董事（法定代表人）、监事、经理、财务负责人、联络人身份证及本人实名的手机号'"
        )

    if "opc_application_drafts" not in table_names:
        statements.append(
            "CREATE TABLE opc_application_drafts ("
            "id INTEGER NOT NULL AUTO_INCREMENT, "
            "site_user_id INTEGER NOT NULL, "
            "form_data TEXT NOT NULL, "
            "shareholders_data TEXT NOT NULL, "
            "material_refs TEXT NOT NULL, "
            "payload_json TEXT NULL, "
            "created_at DATETIME NOT NULL, "
            "updated_at DATETIME NOT NULL, "
            "PRIMARY KEY (id), "
            "UNIQUE KEY ix_opc_application_drafts_site_user_id (site_user_id), "
            "KEY ix_opc_application_drafts_id (id)"
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"
        )
    else:
        draft_columns = {column["name"] for column in inspector.get_columns("opc_application_drafts")}
        if "payload_json" not in draft_columns:
            statements.append("ALTER TABLE opc_application_drafts ADD COLUMN payload_json TEXT NULL")

    if "community_join_applications" not in table_names:
        statements.append(
            "CREATE TABLE community_join_applications ("
            "id INTEGER NOT NULL AUTO_INCREMENT, "
            "site_user_id INTEGER NOT NULL, "
            "site_user_name VARCHAR(64) NULL, "
            "site_user_phone VARCHAR(32) NULL, "
            "target_campus VARCHAR(32) NOT NULL, "
            "status VARCHAR(32) NOT NULL DEFAULT '未上传', "
            "submitted_at DATETIME NOT NULL, "
            "created_at DATETIME NOT NULL, "
            "updated_at DATETIME NOT NULL, "
            "PRIMARY KEY (id), "
            "KEY ix_community_join_applications_id (id), "
            "KEY ix_community_join_applications_site_user_id (site_user_id), "
            "KEY ix_community_join_applications_target_campus (target_campus), "
            "KEY ix_community_join_applications_status (status), "
            "KEY ix_community_join_applications_submitted_at (submitted_at)"
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"
        )

    if "community_join_material_files" not in table_names:
        statements.append(
            "CREATE TABLE community_join_material_files ("
            "id INTEGER NOT NULL AUTO_INCREMENT, "
            "application_id INTEGER NOT NULL, "
            "original_file_name VARCHAR(255) NOT NULL, "
            "storage_path VARCHAR(500) NOT NULL, "
            "file_type VARCHAR(32) NOT NULL, "
            "file_size INTEGER NOT NULL, "
            "is_deleted SMALLINT NOT NULL DEFAULT 0, "
            "deleted_by_admin_user_id INTEGER NULL, "
            "deleted_at DATETIME NULL, "
            "uploaded_by_admin_user_id INTEGER NULL, "
            "uploaded_at DATETIME NOT NULL, "
            "created_at DATETIME NOT NULL, "
            "updated_at DATETIME NOT NULL, "
            "PRIMARY KEY (id), "
            "KEY ix_community_join_material_files_id (id), "
            "KEY ix_community_join_material_files_application_id (application_id), "
            "KEY ix_community_join_material_files_is_deleted (is_deleted)"
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"
        )

    if "community_join_action_logs" not in table_names:
        statements.append(
            "CREATE TABLE community_join_action_logs ("
            "id INTEGER NOT NULL AUTO_INCREMENT, "
            "application_id INTEGER NOT NULL, "
            "material_file_id INTEGER NULL, "
            "action_type VARCHAR(64) NOT NULL, "
            "action_summary VARCHAR(255) NOT NULL, "
            "action_detail TEXT NULL, "
            "operated_by_admin_user_id INTEGER NULL, "
            "operated_by_site_user_id INTEGER NULL, "
            "operated_by_name VARCHAR(64) NULL, "
            "operated_at DATETIME NOT NULL, "
            "created_at DATETIME NOT NULL, "
            "PRIMARY KEY (id), "
            "KEY ix_community_join_action_logs_id (id), "
            "KEY ix_community_join_action_logs_application_id (application_id), "
            "KEY ix_community_join_action_logs_action_type (action_type)"
            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"
        )

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
        {"label": "联系我们", "path": "/feedback", "target_type": "internal", "target_value": "/feedback"},
    ]

    existing = {item.path: item for item in db.query(NavigationItem).all()}
    for index, payload in enumerate(default_items, start=1):
        item = existing.get(payload["path"])
        if item is None:
            db.add(NavigationItem(**payload, sort_order=index, is_visible=1))
            continue
        item.label = payload["label"]


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
        .filter(PageSection.page_key.in_(["home", "community", "marketplace", "api_market", "mcp_market"]))
        .all()
    }
    for payload in [*DEFAULT_STAGE4_PAGE_SECTIONS, *DEFAULT_PAGE_SECTION_UPSERTS]:
        key = (payload["page_key"], payload["section_key"])
        if key in existing_keys:
            continue
        db.add(PageSection(**payload))


def _ensure_setup_hero_title(db: Session) -> None:
    item = (
        db.query(PageSection)
        .filter(PageSection.page_key == "setup", PageSection.section_key == "hero")
        .first()
    )
    if item is None:
        db.add(
            PageSection(
                page_key="setup",
                section_key="hero",
                title=SETUP_HERO_TITLE,
                subtitle="提供企业注册、税务登记、对公账户等一站式开办服务",
                content="",
                extra_json=None,
                sort_order=1,
                is_published=1,
            )
        )
        return

    if item.title != SETUP_HERO_TITLE:
        item.title = SETUP_HERO_TITLE


def _ensure_home_banners(db: Session) -> None:
    items = db.query(Banner).all()
    for item in items:
        expected_image = DEFAULT_BANNER_IMAGE_MAP.get(item.highlight_title)
        if expected_image:
            item.image_url = expected_image


def _ensure_home_service_items(db: Session) -> None:
    items = db.query(ServiceItem).filter(ServiceItem.module_key == "home_service_entries").all()
    for item in items:
        expected_icon = DEFAULT_SERVICE_ICON_MAP.get(item.title)
        if expected_icon:
            item.icon = expected_icon


def _ensure_resource_defaults(db: Session) -> None:
    existing_categories = {item.code: item for item in db.query(ResourceCategory).all()}
    for payload in DEFAULT_RESOURCE_CATEGORIES:
        if payload["code"] in existing_categories:
            continue
        db.add(ResourceCategory(**payload))

    db.flush()

    categories_by_code = {item.code: item for item in db.query(ResourceCategory).all()}
    for payload in DEFAULT_RESOURCE_CATEGORY_PATCHES:
        category = categories_by_code.get(payload["code"])
        if category is None:
            continue
        _apply_resource_category_patch(category, payload)

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
            "primary_button_text": payload.get("primary_button_text"),
            "secondary_link_type": payload.get("secondary_link_type", "none"),
            "secondary_link_value": payload.get("secondary_link_value"),
            "secondary_button_text": payload.get("secondary_button_text"),
            "tags_json": payload.get("tags_json"),
            "meta_json": payload.get("meta_json"),
            "show_on_home": payload.get("show_on_home", 1),
            "sort_order": payload.get("sort_order", 0),
            "is_published": payload.get("is_published", 1),
        }
        db.add(ResourceItem(**item_payload))

    db.flush()

    items_by_key = {
        (item.resource_type, item.category_id, item.title): item
        for item in db.query(ResourceItem).all()
    }
    for payload in DEFAULT_RESOURCE_ITEM_PATCHES:
        category = categories_by_code.get(payload["category_code"])
        if category is None:
            continue

        key = (payload.get("resource_type", "marketplace"), category.id, payload["title"])
        item = items_by_key.get(key)
        if item is None:
            continue
        _apply_resource_item_patch(item, payload)


def _apply_resource_category_patch(item: ResourceCategory, payload: dict) -> None:
    # force_ 前缀字段强制覆盖已有值，无前缀的字段只在为空时才填充
    if payload.get("force_name"):
        item.name = payload["force_name"]
    if payload.get("force_description"):
        item.description = payload["force_description"]
    if payload.get("force_group_key"):
        item.group_key = payload["force_group_key"]
    if not item.image_url and payload.get("image_url"):
        item.image_url = payload["image_url"]
    if not item.display_template or item.display_template == "default":
        item.display_template = payload.get("display_template", item.display_template)
    if payload.get("force_action_type"):
        item.action_type = payload["force_action_type"]
    if payload.get("force_action_value"):
        item.action_value = payload["force_action_value"]
    if payload.get("force_sort_order") is not None:
        item.sort_order = payload["force_sort_order"]
    if payload.get("force_button_text"):
        item.button_text = payload["force_button_text"]
    if payload.get("show_on_home") is not None:
        item.show_on_home = payload["show_on_home"]


def _remove_retired_resource_items(db: Session) -> None:
    candidate_items = (
        db.query(ResourceItem)
        .filter(
            ResourceItem.resource_type == "marketplace",
            ResourceItem.title == "qclaw",
            ResourceItem.link_value == "https://qclaw.qq.com/",
        )
        .all()
    )
    for item in candidate_items:
        # MySQL's default collation is case-insensitive, so verify in Python before deleting.
        if item.title != "qclaw":
            continue
        db.delete(item)


def _apply_resource_item_patch(item: ResourceItem, payload: dict) -> None:
    if item.show_on_home is None and payload.get("show_on_home") is not None:
        item.show_on_home = payload["show_on_home"]
    if not item.image_url and payload.get("image_url"):
        item.image_url = payload["image_url"]
    if not item.primary_button_text and payload.get("primary_button_text"):
        item.primary_button_text = payload["primary_button_text"]
    if (not item.secondary_link_type or item.secondary_link_type == "none") and payload.get("secondary_link_type"):
        item.secondary_link_type = payload["secondary_link_type"]
    if not item.secondary_link_value and payload.get("secondary_link_value"):
        item.secondary_link_value = payload["secondary_link_value"]
    if not item.secondary_button_text and payload.get("secondary_button_text"):
        item.secondary_button_text = payload["secondary_button_text"]
    if not item.meta_json and payload.get("meta_json"):
        item.meta_json = payload["meta_json"]
    if payload.get("force_is_published") and payload.get("is_published") is not None:
        item.is_published = payload["is_published"]
    # force_ 前缀字段：无论现有值如何直接覆盖
    if payload.get("force_summary"):
        item.summary = payload["force_summary"]
    if payload.get("force_link_type"):
        item.link_type = payload["force_link_type"]
    if payload.get("force_link_value"):
        item.link_value = payload["force_link_value"]
