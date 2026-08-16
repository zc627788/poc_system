from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.payment import PaymentProviderCode, PaymentTransactionStatus


class WalletPaymentMethod(str, Enum):
    ALIPAY = "ALIPAY"
    WECHAT = "WECHAT"


class WalletEntryType(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class WalletLedgerSourceType(str, Enum):
    PAID_ORDER = "PAID_ORDER"  # legacy mirror rows; new cash flow does not create these
    CONSUMPTION = "CONSUMPTION"  # legacy mirror rows; new cash flow does not create these
    RECHARGE_ORDER = "RECHARGE_ORDER"
    ORDER_PAYMENT = "ORDER_PAYMENT"


class WalletSummaryResponse(BaseModel):
    current_balance: Decimal
    total_recharged: Decimal
    total_consumed: Decimal
    last_updated_at: datetime | None


class WalletLedgerRecordResponse(BaseModel):
    id: int
    entry_type: WalletEntryType
    amount: Decimal
    source_type: WalletLedgerSourceType
    source_id: int
    title: str
    service_code: str | None
    service_name: str | None
    occurred_at: datetime
    created_at: datetime


class WalletLedgerListResponse(BaseModel):
    items: list[WalletLedgerRecordResponse]
    total: int
    page: int
    page_size: int


class WalletTransactionType(str, Enum):
    RECHARGE = "RECHARGE"
    ORDER_PAYMENT = "ORDER_PAYMENT"
    # Legacy labels kept for old rows that may still exist in DB
    PREPAID_CREDIT = "PREPAID_CREDIT"
    CONSUMPTION = "CONSUMPTION"
    DIRECT_PURCHASE = "DIRECT_PURCHASE"


class WalletTransactionResponse(BaseModel):
    id: str
    transaction_type: WalletTransactionType
    amount: Decimal
    title: str
    occurred_at: datetime
    reference_no: str | None
    order_id: int | None
    order_no: str | None
    service_code: str | None
    service_name: str | None
    payment_method: WalletPaymentMethod | None


class WalletTransactionListResponse(BaseModel):
    items: list[WalletTransactionResponse]
    total: int
    page: int
    page_size: int


class WalletRechargeLaunchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    amount: Decimal
    payment_method: WalletPaymentMethod

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        normalized = value.quantize(Decimal("0.01"))
        if normalized <= 0:
            raise ValueError("充值金额必须大于 0")
        if normalized > Decimal("1000000.00"):
            raise ValueError("充值金额不能超过 1000000.00")
        return normalized


class WalletRechargeOrderResponse(BaseModel):
    id: int
    recharge_no: str
    amount: Decimal
    currency: str
    payment_method: WalletPaymentMethod
    status: str
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime


class WalletPaymentTransactionResponse(BaseModel):
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


class WalletRechargeLaunchResponse(BaseModel):
    recharge: WalletRechargeOrderResponse
    payment: WalletPaymentTransactionResponse
    checkout_url: str


class WalletRechargePaymentStatusResponse(BaseModel):
    recharge_id: int
    recharge_no: str
    recharge_status: str
    payment_method: WalletPaymentMethod
    amount: Decimal
    paid_at: datetime | None
    latest_payment: WalletPaymentTransactionResponse | None


class AdminWalletLedgerItemResponse(BaseModel):
    id: int
    site_user_id: int
    user_name: str
    user_phone_masked: str
    entry_type: WalletEntryType
    amount: Decimal
    source_type: WalletLedgerSourceType
    source_id: int
    title: str
    service_code: str | None
    service_name: str | None
    reference_no: str | None
    order_id: int | None
    occurred_at: datetime
    created_at: datetime


class AdminWalletLedgerListResponse(BaseModel):
    items: list[AdminWalletLedgerItemResponse]
    total: int
    page: int
    page_size: int


class AdminWalletRechargeItemResponse(BaseModel):
    id: int
    recharge_no: str
    site_user_id: int
    user_name: str
    user_phone_masked: str
    amount: Decimal
    currency: str
    payment_method: WalletPaymentMethod
    status: str
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AdminWalletRechargeListResponse(BaseModel):
    items: list[AdminWalletRechargeItemResponse]
    total: int
    page: int
    page_size: int
