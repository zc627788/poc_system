from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SiteUser(Base):
    __tablename__ = "site_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    real_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    auth_source: Mapped[str] = mapped_column(String(32), default="local", nullable=False)
    external_open_id: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True, index=True)
    external_user_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    user_type: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mobile_fuzzy: Mapped[str | None] = mapped_column(String(32), nullable=True)
    raw_profile_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
