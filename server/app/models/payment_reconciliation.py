from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PaymentReconciliationBatch(Base):
    __tablename__ = "payment_reconciliation_batches"
    __table_args__ = (
        UniqueConstraint("provider", "statement_date", name="uk_payment_reconciliation_batches_provider_date"),
        CheckConstraint("provider_total_amount >= 0", name="ck_payment_reconciliation_batches_provider_amount"),
        CheckConstraint("system_total_amount >= 0", name="ck_payment_reconciliation_batches_system_amount"),
        CheckConstraint("run_status IN ('SUCCESS', 'FAILED')", name="ck_payment_reconciliation_batches_run_status"),
        Index("idx_payment_reconciliation_batches_list", "provider", "statement_date", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    statement_date: Mapped[date] = mapped_column(Date, nullable=False)
    run_status: Mapped[str] = mapped_column(String(16), default="SUCCESS", nullable=False)
    provider_total_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    provider_total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
    system_total_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    system_total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0.00"), nullable=False)
    matched_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    amount_mismatch_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status_mismatch_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    system_only_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    provider_only_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    executed_by_admin_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PaymentReconciliationItem(Base):
    __tablename__ = "payment_reconciliation_items"
    __table_args__ = (
        CheckConstraint(
            "result IN ('MATCHED', 'AMOUNT_MISMATCH', 'STATUS_MISMATCH', 'SYSTEM_ONLY', 'PROVIDER_ONLY')",
            name="ck_payment_reconciliation_items_result",
        ),
        Index("idx_payment_reconciliation_items_batch_result", "batch_id", "result", "id"),
        Index("idx_payment_reconciliation_items_payment", "payment_transaction_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("payment_reconciliation_batches.id", ondelete="CASCADE"),
        nullable=False,
    )
    payment_transaction_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("payment_transactions.id", ondelete="SET NULL"),
        nullable=True,
    )
    payment_no: Mapped[str | None] = mapped_column(String(40), nullable=True)
    provider_transaction_no: Mapped[str | None] = mapped_column(String(64), nullable=True)
    order_no: Mapped[str | None] = mapped_column(String(40), nullable=True)
    system_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    provider_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    system_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    provider_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    result: Mapped[str] = mapped_column(String(24), nullable=False)
    difference_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
