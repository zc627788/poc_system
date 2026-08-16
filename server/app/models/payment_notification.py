from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PaymentNotification(Base):
    __tablename__ = "payment_notifications"
    __table_args__ = (
        UniqueConstraint("provider", "notification_id", name="uk_payment_notifications_provider_notification"),
        CheckConstraint(
            "process_status IN ('RECEIVED', 'PROCESSED', 'REJECTED')",
            name="ck_payment_notifications_process_status",
        ),
        Index("idx_payment_notifications_received", "provider", "received_at", "id"),
        Index("idx_payment_notifications_payment", "payment_transaction_id", "received_at", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    notification_id: Mapped[str] = mapped_column(String(80), nullable=False)
    payment_transaction_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("payment_transactions.id", ondelete="SET NULL"),
        nullable=True,
    )
    signature_valid: Mapped[bool] = mapped_column(Integer, default=0, nullable=False)
    process_status: Mapped[str] = mapped_column(String(16), default="RECEIVED", nullable=False)
    headers_json: Mapped[str] = mapped_column(Text, nullable=False)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
