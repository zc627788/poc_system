from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import (
        admin_user,
        article,
        article_category,
        banner,
        billing_order,
        billing_product,
        community_join_action_log,
        community_join_application,
        community_join_material_file,
        consumption_import,
        consumption_record,
        feedback,
        mock_payment_transaction,
        navigation_item,
        opc_application,
        opc_application_action_log,
        opc_application_draft,
        opc_application_material_file,
        opc_application_review_record,
        page_section,
        payment_notification,
        payment_reconciliation,
        payment_transaction,
        prepaid_ledger_entry,
        resource_category,
        resource_item,
        service_item,
        site_user,
        site_setting,
        wallet_ledger_entry,
        wallet_payment_transaction,
        wallet_recharge_order,
        trusted_dataspace,
    )

    Base.metadata.create_all(bind=engine)
