from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BillingOrder(Base):
    __tablename__ = "billing_orders"
    __table_args__ = (
        UniqueConstraint("order_no", name="uk_billing_orders_order_no"),
        UniqueConstraint("site_user_id", "request_id", name="uk_billing_orders_user_request"),
        CheckConstraint("billing_mode IN ('MONTHLY', 'PREPAID')", name="ck_billing_orders_mode"),
        CheckConstraint("unit_price > 0 AND order_amount > 0", name="ck_billing_orders_amount"),
        CheckConstraint("currency = 'CNY'", name="ck_billing_orders_currency"),
        CheckConstraint(
            "status IN ('PENDING_PAYMENT', 'PAID', 'CANCELED', 'PAYMENT_FAILED')",
            name="ck_billing_orders_status",
        ),
        CheckConstraint(
            "(billing_mode = 'MONTHLY' AND month_count BETWEEN 1 AND 36 "
            "AND service_start_date IS NOT NULL AND service_end_date IS NOT NULL) "
            "OR (billing_mode = 'PREPAID' AND month_count IS NULL "
            "AND service_start_date IS NULL AND service_end_date IS NULL)",
            name="ck_billing_orders_period",
        ),
        Index("idx_billing_orders_user_list", "site_user_id", "created_at", "id"),
        Index("idx_billing_orders_admin_list", "status", "created_at", "id"),
        Index("idx_billing_orders_product", "product_id"),
        Index("idx_billing_orders_service", "service_code"),
        Index("idx_billing_orders_mode", "billing_mode"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    order_no: Mapped[str] = mapped_column(String(40), nullable=False)
    site_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("site_users.id", ondelete="RESTRICT"), nullable=False)
    request_id: Mapped[str] = mapped_column(String(64), nullable=False)
    product_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("billing_products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_code: Mapped[str] = mapped_column(String(64), nullable=False)
    product_name: Mapped[str] = mapped_column(String(128), nullable=False)
    service_code: Mapped[str] = mapped_column(String(64), nullable=False)
    service_name: Mapped[str] = mapped_column(String(128), nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(128), nullable=False)
    billing_mode: Mapped[str] = mapped_column(String(16), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    month_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    order_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    service_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    service_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(24), default="PENDING_PAYMENT", nullable=False)
    payment_channel: Mapped[str | None] = mapped_column(String(16), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
