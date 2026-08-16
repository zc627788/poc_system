from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ConsumptionRecord(Base):
    __tablename__ = "consumption_records"
    __table_args__ = (
        UniqueConstraint(
            "record_source",
            "supplier_name",
            "supplier_record_no",
            name="uk_consumption_records_source_supplier_record",
        ),
        UniqueConstraint("import_row_id", name="uk_consumption_records_import_row"),
        CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_consumption_records_quantity"),
        CheckConstraint("amount > 0", name="ck_consumption_records_amount"),
        CheckConstraint("currency = 'CNY'", name="ck_consumption_records_currency"),
        Index("idx_consumption_records_user_service_time", "site_user_id", "service_code", "consumed_at", "id"),
        Index("idx_consumption_records_batch", "batch_id", "id"),
        Index("idx_consumption_records_order", "order_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("consumption_import_batches.id", ondelete="RESTRICT"),
        nullable=False,
    )
    import_row_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("consumption_import_rows.id", ondelete="RESTRICT"),
        nullable=False,
    )
    record_source: Mapped[str] = mapped_column(String(32), default="EXCEL", nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(128), nullable=False)
    supplier_record_no: Mapped[str] = mapped_column(String(128), nullable=False)
    site_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("site_users.id", ondelete="RESTRICT"), nullable=False)
    service_code: Mapped[str] = mapped_column(String(64), nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=False)
    order_id: Mapped[int | None] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("billing_orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    consumed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    remark: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
