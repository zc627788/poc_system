from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CommunityJoinApplication(Base):
    __tablename__ = "community_join_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    site_user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    site_user_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    site_user_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    target_campus: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="未上传", nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
