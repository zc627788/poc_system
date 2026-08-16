from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ConsumptionImportBatch(Base):
    __tablename__ = "consumption_import_batches"
    __table_args__ = (
        UniqueConstraint("batch_no", name="uk_consumption_import_batches_batch_no"),
        CheckConstraint(
            "status IN ('PARSING', 'PREVIEWED', 'IMPORTING', 'COMPLETED', 'EXPIRED', 'FAILED')",
            name="ck_consumption_import_batches_status",
        ),
        CheckConstraint("total_rows >= 0", name="ck_consumption_import_batches_total_rows"),
        CheckConstraint("valid_rows >= 0", name="ck_consumption_import_batches_valid_rows"),
        CheckConstraint("invalid_rows >= 0", name="ck_consumption_import_batches_invalid_rows"),
        CheckConstraint("imported_rows >= 0", name="ck_consumption_import_batches_imported_rows"),
        Index("idx_consumption_import_batches_uploaded_at", "uploaded_at", "id"),
        Index("idx_consumption_import_batches_status", "status", "uploaded_at", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    batch_no: Mapped[str] = mapped_column(String(40), nullable=False)
    record_source: Mapped[str] = mapped_column(String(32), default="EXCEL", nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="PARSING", nullable=False)
    total_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    valid_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    invalid_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    imported_rows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    uploaded_by: Mapped[int] = mapped_column(Integer, nullable=False)
    confirmed_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ConsumptionImportRow(Base):
    __tablename__ = "consumption_import_rows"
    __table_args__ = (
        UniqueConstraint("batch_id", "row_no", name="uk_consumption_import_rows_batch_row"),
        CheckConstraint("quantity IS NULL OR quantity >= 0", name="ck_consumption_import_rows_quantity"),
        CheckConstraint("amount IS NULL OR amount > 0", name="ck_consumption_import_rows_amount"),
        CheckConstraint(
            "row_status IN ('VALID', 'INVALID', 'IMPORTED')",
            name="ck_consumption_import_rows_status",
        ),
        Index("idx_consumption_import_rows_batch_status", "batch_id", "row_status", "row_no"),
        Index("idx_consumption_import_rows_user_service", "site_user_id", "service_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    batch_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("consumption_import_batches.id", ondelete="CASCADE"),
        nullable=False,
    )
    row_no: Mapped[int] = mapped_column(Integer, nullable=False)
    record_source: Mapped[str] = mapped_column(String(32), default="EXCEL", nullable=False)
    raw_values_json: Mapped[str] = mapped_column(Text, nullable=False)
    supplier_record_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    user_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    service_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    supplier_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    item_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    quantity: Mapped[Decimal | None] = mapped_column(Numeric(18, 6), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(32), nullable=True)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    order_no: Mapped[str | None] = mapped_column(String(40), nullable=True)
    remark: Mapped[str | None] = mapped_column(String(500), nullable=True)
    site_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    service_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    order_id: Mapped[int | None] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), nullable=True)
    row_status: Mapped[str] = mapped_column(String(16), default="INVALID", nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
