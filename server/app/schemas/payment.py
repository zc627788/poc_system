from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator

class PaymentProviderCode(str, Enum):
    MOCK = "MOCK"


class PaymentTransactionStatus(str, Enum):
    CREATED = "CREATED"
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CLOSED = "CLOSED"


class PaymentNotificationProcessStatus(str, Enum):
    RECEIVED = "RECEIVED"
    PROCESSED = "PROCESSED"
    REJECTED = "REJECTED"


class PaymentReconciliationResult(str, Enum):
    MATCHED = "MATCHED"
    AMOUNT_MISMATCH = "AMOUNT_MISMATCH"
    STATUS_MISMATCH = "STATUS_MISMATCH"
    SYSTEM_ONLY = "SYSTEM_ONLY"
    PROVIDER_ONLY = "PROVIDER_ONLY"


class PaymentReconciliationRunStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class MockPaymentNotificationMode(str, Enum):
    IMMEDIATE = "IMMEDIATE"
    DELAYED = "DELAYED"
    NONE = "NONE"


class PaymentTransactionSummaryResponse(BaseModel):
    id: int
    payment_no: str
    provider: PaymentProviderCode
    provider_transaction_no: str | None
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    checkout_url: str | None
    provider_completed_at: datetime | None
    failure_code: str | None
    failure_message: str | None
    created_at: datetime
    updated_at: datetime


class OrderPaymentMethod(str, Enum):
    EXTERNAL = "EXTERNAL"
    WALLET = "WALLET"


class PaymentLaunchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_method: OrderPaymentMethod = OrderPaymentMethod.EXTERNAL


class PaymentLaunchResponse(BaseModel):
    payment_no: str
    provider: str
    status: PaymentTransactionStatus
    checkout_url: str = ""
    payment_method: OrderPaymentMethod = OrderPaymentMethod.EXTERNAL
    order_id: int | None = None
    order_status: str | None = None


class BillingOrderPaymentStatusResponse(BaseModel):
    order_id: int
    order_no: str
    order_status: str
    payment_channel: str | None = None
    paid_at: datetime | None
    latest_payment: PaymentTransactionSummaryResponse | None


class PaymentReconciliationCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: PaymentProviderCode
    statement_date: date


class PaymentReconciliationBatchSummaryResponse(BaseModel):
    id: int
    provider: PaymentProviderCode
    statement_date: date
    run_status: PaymentReconciliationRunStatus
    provider_total_count: int
    provider_total_amount: Decimal
    system_total_count: int
    system_total_amount: Decimal
    matched_count: int
    amount_mismatch_count: int
    status_mismatch_count: int
    system_only_count: int
    provider_only_count: int
    executed_by_admin_user_id: int
    executed_at: datetime
    created_at: datetime
    updated_at: datetime


class PaymentReconciliationBatchListResponse(BaseModel):
    items: list[PaymentReconciliationBatchSummaryResponse]
    total: int
    page: int
    page_size: int


class PaymentReconciliationItemResponse(BaseModel):
    id: int
    payment_transaction_id: int | None
    payment_no: str | None
    provider_transaction_no: str | None
    order_no: str | None
    system_amount: Decimal | None
    provider_amount: Decimal | None
    system_status: PaymentTransactionStatus | None
    provider_status: PaymentTransactionStatus | None
    result: PaymentReconciliationResult
    difference_message: str | None
    created_at: datetime
    updated_at: datetime


class PaymentReconciliationBatchDetailResponse(BaseModel):
    batch: PaymentReconciliationBatchSummaryResponse
    items: list[PaymentReconciliationItemResponse]
    total: int
    page: int
    page_size: int


class MockPaymentTransactionResponse(BaseModel):
    provider_transaction_no: str
    payment_no: str
    order_no: str
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    notification_mode: MockPaymentNotificationMode
    notification_status: str
    completed_at: datetime | None
    return_url: str


class MockPaymentCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    payment_no: str
    order_no: str
    amount: Decimal
    currency: str = "CNY"
    subject: str
    notify_url: str
    return_url: str
    api_base_url: str


class MockPaymentCompleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    result: PaymentTransactionStatus
    notification_mode: MockPaymentNotificationMode = MockPaymentNotificationMode.IMMEDIATE

    @field_validator("result")
    @classmethod
    def validate_result(cls, value: PaymentTransactionStatus) -> PaymentTransactionStatus:
        if value not in {PaymentTransactionStatus.SUCCESS, PaymentTransactionStatus.FAILED}:
            raise ValueError("只支持模拟成功或失败支付")
        return value


class MockPaymentCompleteResponse(BaseModel):
    provider_transaction_no: str
    status: PaymentTransactionStatus
    return_url: str


class StatementEntryResponse(BaseModel):
    payment_no: str
    provider_transaction_no: str
    order_no: str
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    completed_at: datetime | None
