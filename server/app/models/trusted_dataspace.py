from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TrustedDataspaceRegistration(Base):
    __tablename__ = "trusted_dataspace_registrations"
    __table_args__ = (
        UniqueConstraint("site_user_id", name="uk_trusted_dataspace_registrations_user"),
        Index("idx_trusted_dataspace_registrations_status_updated", "status", "updated_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    site_user_id: Mapped[int] = mapped_column(ForeignKey("site_users.id", ondelete="RESTRICT"), nullable=False)
    dept_name: Mapped[str] = mapped_column(String(255), nullable=False)
    credit_code: Mapped[str] = mapped_column(String(18), nullable=False, unique=True, index=True)
    legal_person_name: Mapped[str] = mapped_column(String(128), nullable=False)
    legal_person_id_card_ciphertext: Mapped[str] = mapped_column(Text, nullable=False)
    legal_person_phone: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    account: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    current_seq_no: Mapped[str | None] = mapped_column(String(128), nullable=True, unique=True)
    provider_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    last_error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class TrustedDataspaceSubmissionAttempt(Base):
    __tablename__ = "trusted_dataspace_submission_attempts"
    __table_args__ = (
        UniqueConstraint("registration_id", "idempotency_key", name="uk_trusted_dataspace_attempts_registration_key"),
        Index("idx_trusted_dataspace_attempts_registration_created", "registration_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    registration_id: Mapped[int] = mapped_column(
        ForeignKey("trusted_dataspace_registrations.id", ondelete="RESTRICT"), nullable=False
    )
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    seq_no: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    result_status: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    provider_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    request_started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
