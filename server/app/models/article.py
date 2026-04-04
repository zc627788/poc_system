from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("article_categories.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    link_type: Mapped[str] = mapped_column(String(32), default="external", nullable=False)
    external_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    publish_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    source_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_top: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    is_published: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category: Mapped["ArticleCategory"] = relationship("ArticleCategory")

