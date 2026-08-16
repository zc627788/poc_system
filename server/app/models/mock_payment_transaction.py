from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MockPaymentTransaction(Base):
    __tablename__ = "mock_payment_transactions"
    __table_args__ = (
        UniqueConstraint("payment_no", name="uk_mock_payment_transactions_payment_no"),
        UniqueConstraint("provider_transaction_no", name="uk_mock_payment_transactions_provider_tx"),
        UniqueConstraint("checkout_token", name="uk_mock_payment_transactions_checkout_token"),
        CheckConstraint("amount > 0", name="ck_mock_payment_transactions_amount"),
        CheckConstraint("currency = 'CNY'", name="ck_mock_payment_transactions_currency"),
        CheckConstraint(
            "status IN ('PENDING', 'SUCCESS', 'FAILED', 'CLOSED')",
            name="ck_mock_payment_transactions_status",
        ),
        CheckConstraint(
            "notification_mode IN ('IMMEDIATE', 'DELAYED', 'NONE')",
            name="ck_mock_payment_transactions_notification_mode",
        ),
        CheckConstraint(
            "notification_status IN ('PENDING', 'SCHEDULED', 'SKIPPED', 'SENT')",
            name="ck_mock_payment_transactions_notification_status",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    payment_no: Mapped[str] = mapped_column(String(40), nullable=False)
    order_no: Mapped[str] = mapped_column(String(40), nullable=False)
    provider_transaction_no: Mapped[str] = mapped_column(String(64), nullable=False)
    checkout_token: Mapped[str] = mapped_column(String(80), nullable=False)
    subject: Mapped[str] = mapped_column(String(128), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    notify_url: Mapped[str] = mapped_column(String(500), nullable=False)
    return_url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="PENDING", nullable=False)
    failure_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    failure_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notification_mode: Mapped[str] = mapped_column(String(16), default="IMMEDIATE", nullable=False)
    notification_status: Mapped[str] = mapped_column(String(16), default="PENDING", nullable=False)
    notification_due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    notification_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
