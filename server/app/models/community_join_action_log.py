from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CommunityJoinActionLog(Base):
    __tablename__ = "community_join_action_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    material_file_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    action_summary: Mapped[str] = mapped_column(String(255), nullable=False)
    action_detail: Mapped[str | None] = mapped_column(Text, nullable=True)
    operated_by_admin_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    operated_by_site_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    operated_by_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    operated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
