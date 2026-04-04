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
        feedback,
        navigation_item,
        page_section,
        resource_category,
        resource_item,
        service_item,
        site_user,
        site_setting,
    )

    Base.metadata.create_all(bind=engine)
