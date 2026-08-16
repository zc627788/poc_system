from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.billing import BillingMode
from app.schemas.payment import PaymentTransactionSummaryResponse


class BillingOrderStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    CANCELED = "CANCELED"
    PAYMENT_FAILED = "PAYMENT_FAILED"


class BillingOrderPaymentChannel(str, Enum):
    EXTERNAL = "EXTERNAL"
    WALLET = "WALLET"


class BillingOrderCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: int
    month_count: int | None = None

    @field_validator("product_id")
    @classmethod
    def validate_product_id(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("商品 ID 不合法")
        return value


class BillingOrderResponse(BaseModel):
    id: int
    order_no: str
    product_id: int
    product_code: str
    product_name: str
    service_code: str
    service_name: str
    supplier_name: str
    billing_mode: BillingMode
    unit_price: Decimal
    month_count: int | None
    order_amount: Decimal
    currency: str
    service_start_date: date | None
    service_end_date: date | None
    status: BillingOrderStatus
    payment_channel: BillingOrderPaymentChannel | None = None
    paid_at: datetime | None
    canceled_at: datetime | None
    expires_at: datetime | None = None
    payment_transactions: list[PaymentTransactionSummaryResponse] = []
    created_at: datetime
    updated_at: datetime


class BillingOrderListResponse(BaseModel):
    items: list[BillingOrderResponse]
    total: int
    page: int
    page_size: int


class BillingOrderAdminResponse(BillingOrderResponse):
    site_user_id: int
    user_name: str
    user_phone_masked: str


class BillingOrderAdminListResponse(BaseModel):
    items: list[BillingOrderAdminResponse]
    total: int
    page: int
    page_size: int
