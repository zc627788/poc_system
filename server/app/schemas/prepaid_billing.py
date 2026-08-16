from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict


class ConsumptionImportBatchStatus(str, Enum):
    PARSING = "PARSING"
    PREVIEWED = "PREVIEWED"
    IMPORTING = "IMPORTING"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    FAILED = "FAILED"


class ConsumptionImportRowStatus(str, Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    IMPORTED = "IMPORTED"


class PrepaidLedgerEntryType(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class PrepaidLedgerSourceType(str, Enum):
    PAID_ORDER = "PAID_ORDER"
    CONSUMPTION = "CONSUMPTION"


class BalanceSummaryResponse(BaseModel):
    service_code: str
    service_name: str
    total_recharged: Decimal
    total_consumed: Decimal
    remaining_balance: Decimal
    insufficient: bool
    last_updated_at: datetime | None


class ConsumptionSummaryResponse(BaseModel):
    total_amount: Decimal


class ConsumptionRecordResponse(BaseModel):
    id: int
    supplier_name: str
    supplier_record_no: str
    site_user_id: int
    user_name: str | None = None
    user_phone_masked: str | None = None
    service_code: str
    service_name: str
    order_id: int | None
    order_no: str | None
    consumed_at: datetime
    item_name: str
    quantity: Decimal | None
    unit: str | None
    amount: Decimal
    currency: str
    remark: str | None
    created_at: datetime


class ConsumptionRecordListResponse(BaseModel):
    items: list[ConsumptionRecordResponse]
    total: int
    page: int
    page_size: int
    summary: ConsumptionSummaryResponse


class AdminBalanceSummaryResponse(BalanceSummaryResponse):
    site_user_id: int
    user_name: str
    user_phone_masked: str


class AdminBalanceListResponse(BaseModel):
    items: list[AdminBalanceSummaryResponse]
    total: int
    page: int
    page_size: int


class ConsumptionImportRowResponse(BaseModel):
    id: int
    row_no: int
    record_source: str
    supplier_record_no: str | None
    consumed_at: datetime | None
    user_phone: str | None
    service_code: str | None
    supplier_name: str | None
    item_name: str | None
    quantity: Decimal | None
    unit: str | None
    amount: Decimal | None
    order_no: str | None
    remark: str | None
    site_user_id: int | None
    service_name: str | None
    order_id: int | None
    row_status: ConsumptionImportRowStatus
    error_message: str | None
    raw_values: dict[str, str | None]


class ConsumptionImportBatchSummaryResponse(BaseModel):
    id: int
    batch_no: str
    record_source: str
    file_name: str
    file_sha256: str
    status: ConsumptionImportBatchStatus
    total_rows: int
    valid_rows: int
    invalid_rows: int
    imported_rows: int
    uploaded_by: int
    confirmed_by: int | None
    uploaded_at: datetime
    confirmed_at: datetime | None
    expires_at: datetime
    error_message: str | None


class ConsumptionImportBatchDetailResponse(BaseModel):
    batch: ConsumptionImportBatchSummaryResponse
    items: list[ConsumptionImportRowResponse]
    total: int
    page: int
    page_size: int


class PrepaidBackfillResultResponse(BaseModel):
    scanned_orders: int
    inserted_entries: int


class ConsumptionRecordListQuery(BaseModel):
    page: int = 1
    page_size: int = 20


class BillingBalancesQuery(BaseModel):
    page: int = 1
    page_size: int = 20


class ConsumptionImportPreviewResponse(ConsumptionImportBatchDetailResponse):
    pass


class ConsumptionImportConfirmResponse(ConsumptionImportBatchSummaryResponse):
    pass


class ConsumptionSourceRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    record_source: str = "EXCEL"
    supplier_record_no: str | None = None
    consumed_at_text: str | None = None
    user_phone: str | None = None
    service_code: str | None = None
    supplier_name: str | None = None
    item_name: str | None = None
    quantity_text: str | None = None
    unit: str | None = None
    amount_text: str | None = None
    order_no: str | None = None
    remark: str | None = None
