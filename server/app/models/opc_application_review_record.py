from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OpcApplicationReviewRecord(Base):
    __tablename__ = "opc_application_review_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    previous_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    current_status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_visible_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    operated_by_admin_user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    operated_by_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    operated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
