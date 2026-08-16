from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WalletRechargeOrder(Base):
    __tablename__ = "wallet_recharge_orders"
    __table_args__ = (
        UniqueConstraint("recharge_no", name="uk_wallet_recharge_orders_no"),
        UniqueConstraint("site_user_id", "request_id", name="uk_wallet_recharge_orders_user_request"),
        CheckConstraint("amount > 0", name="ck_wallet_recharge_orders_amount"),
        CheckConstraint("currency = 'CNY'", name="ck_wallet_recharge_orders_currency"),
        CheckConstraint("payment_method IN ('ALIPAY', 'WECHAT')", name="ck_wallet_recharge_orders_method"),
        CheckConstraint(
            "status IN ('PENDING_PAYMENT', 'PAID', 'CANCELED', 'PAYMENT_FAILED')",
            name="ck_wallet_recharge_orders_status",
        ),
        Index("idx_wallet_recharge_orders_user_created", "site_user_id", "created_at", "id"),
        Index("idx_wallet_recharge_orders_status_created", "status", "created_at", "id"),
    )

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    recharge_no: Mapped[str] = mapped_column(String(40), nullable=False)
    site_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("site_users.id", ondelete="RESTRICT"), nullable=False)
    request_id: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="CNY", nullable=False)
    payment_method: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(24), default="PENDING_PAYMENT", nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
