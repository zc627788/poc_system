from datetime import datetime

from sqlalchemy import DateTime, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ResourceCategory(Base):
    __tablename__ = "resource_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    group_key: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    icon: Mapped[str | None] = mapped_column(String(64), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    display_template: Mapped[str] = mapped_column(String(32), default="default", nullable=False)
    action_type: Mapped[str] = mapped_column(String(32), default="none", nullable=False)
    action_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    button_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    show_on_home: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_published: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    items = relationship("ResourceItem", back_populates="category")
