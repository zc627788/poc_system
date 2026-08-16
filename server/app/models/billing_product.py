from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BillingProduct(Base):
    __tablename__ = "billing_products"
    __table_args__ = (
        UniqueConstraint("product_code", name="uk_billing_products_product_code"),
        CheckConstraint("billing_mode IN ('MONTHLY', 'PREPAID')", name="ck_billing_products_mode"),
        CheckConstraint("price > 0", name="ck_billing_products_price"),
        CheckConstraint("currency = 'CNY'", name="ck_billing_products_currency"),
        CheckConstraint("status IN ('ON_SALE', 'OFF_SALE')", name="ck_billing_products_status"),
        Index("idx_billing_products_public", "status", "billing_mode", "sort_order", "id"),
        Index("idx_billing_products_service", "service_code", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    product_code: Mapped[str] = mapped_column(String(64), nullable=False)
    service_code: Mapped[str] = mapped_column(String(64), nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    billing_mode: Mapped[str] = mapped_column(String(16), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="OFF_SALE", nullable=False)
    created_by: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_by: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
