from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResourceItem(Base):
    __tablename__ = "resource_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("resource_categories.id"), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    badge_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    link_type: Mapped[str] = mapped_column(String(32), default="none", nullable=False)
    link_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tags_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("ResourceCategory", back_populates="items")
