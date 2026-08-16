from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WalletLedgerEntry(Base):
    __tablename__ = "wallet_ledger_entries"
    __table_args__ = (
        UniqueConstraint("source_type", "source_id", name="uk_wallet_ledger_entries_source"),
        CheckConstraint("entry_type IN ('CREDIT', 'DEBIT')", name="ck_wallet_ledger_entries_type"),
        CheckConstraint("amount > 0", name="ck_wallet_ledger_entries_amount"),
        CheckConstraint("currency = 'CNY'", name="ck_wallet_ledger_entries_currency"),
        CheckConstraint(
            "source_type IN ('PAID_ORDER', 'CONSUMPTION', 'RECHARGE_ORDER', 'ORDER_PAYMENT')",
            name="ck_wallet_ledger_entries_source_type",
        ),
        Index("idx_wallet_ledger_entries_user_time", "site_user_id", "occurred_at", "id"),
        Index("idx_wallet_ledger_entries_user_type_time", "site_user_id", "entry_type", "occurred_at", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    site_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_type: Mapped[str] = mapped_column(String(16), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    source_type: Mapped[str] = mapped_column(String(24), nullable=False)
    source_id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    service_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    service_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
