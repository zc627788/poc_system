from datetime import datetime

from sqlalchemy import DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OpcApplicationDraft(Base):
    __tablename__ = "opc_application_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    site_user_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    form_data: Mapped[str] = mapped_column(Text, nullable=False)
    shareholders_data: Mapped[str] = mapped_column(Text, nullable=False)
    material_refs: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
