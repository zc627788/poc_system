from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WalletPaymentTransaction(Base):
    __tablename__ = "wallet_payment_transactions"
    __table_args__ = (
        UniqueConstraint("payment_no", name="uk_wallet_payment_transactions_payment_no"),
        UniqueConstraint("provider", "provider_transaction_no", name="uk_wallet_payment_transactions_provider_tx"),
        CheckConstraint("amount > 0", name="ck_wallet_payment_transactions_amount"),
        CheckConstraint("currency = 'CNY'", name="ck_wallet_payment_transactions_currency"),
        CheckConstraint(
            "status IN ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'CLOSED')",
            name="ck_wallet_payment_transactions_status",
        ),
        Index("idx_wallet_payment_transactions_order_created", "recharge_order_id", "created_at", "id"),
        Index("idx_wallet_payment_transactions_provider_status", "provider", "status", "created_at", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    payment_no: Mapped[str] = mapped_column(String(40), nullable=False)
    recharge_order_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("wallet_recharge_orders.id", ondelete="RESTRICT"),
        nullable=False,
    )
    recharge_no: Mapped[str] = mapped_column(String(40), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_transaction_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="CREATED", nullable=False)
    checkout_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    provider_completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_query_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    failure_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    failure_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
