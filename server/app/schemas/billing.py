import re
from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator


CODE_PATTERN = re.compile(r"^[A-Z0-9_]{2,64}$")


class BillingMode(str, Enum):
    MONTHLY = "MONTHLY"
    PREPAID = "PREPAID"


class BillingProductStatus(str, Enum):
    ON_SALE = "ON_SALE"
    OFF_SALE = "OFF_SALE"


def _validate_code(value: str) -> str:
    normalized = value.strip()
    if not CODE_PATTERN.fullmatch(normalized):
        raise ValueError("编码只能包含大写英文字母、数字和下划线，长度为 2 到 64 位")
    return normalized


def _validate_text(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name}不能为空")
    return normalized


def _validate_price(value: Decimal) -> Decimal:
    if value <= 0:
        raise ValueError("价格必须大于 0")
    if value.as_tuple().exponent < -2:
        raise ValueError("价格最多保留两位小数")
    if value >= Decimal("10000000000000000"):
        raise ValueError("价格超出允许范围")
    return value.quantize(Decimal("0.01"))


class BillingProductCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_code: str
    service_code: str
    service_name: str
    supplier_name: str
    name: str
    description: str | None = None
    billing_mode: BillingMode
    price: Decimal
    sort_order: int = 0
    status: BillingProductStatus = BillingProductStatus.OFF_SALE

    @field_validator("product_code", "service_code")
    @classmethod
    def validate_code(cls, value: str) -> str:
        return _validate_code(value)

    @field_validator("service_name", "supplier_name", "name")
    @classmethod
    def validate_required_text(cls, value: str, info) -> str:
        labels = {"service_name": "服务名称", "supplier_name": "供应商名称", "name": "商品名称"}
        return _validate_text(value, labels[info.field_name])

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("price")
    @classmethod
    def validate_price(cls, value: Decimal) -> Decimal:
        return _validate_price(value)


class BillingProductUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_code: str | None = None
    service_code: str
    service_name: str
    supplier_name: str
    name: str
    description: str | None = None
    billing_mode: BillingMode
    price: Decimal
    sort_order: int = 0
    status: BillingProductStatus

    @field_validator("product_code", "service_code")
    @classmethod
    def validate_code(cls, value: str | None) -> str | None:
        return _validate_code(value) if value is not None else None

    @field_validator("service_name", "supplier_name", "name")
    @classmethod
    def validate_required_text(cls, value: str, info) -> str:
        labels = {"service_name": "服务名称", "supplier_name": "供应商名称", "name": "商品名称"}
        return _validate_text(value, labels[info.field_name])

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("price")
    @classmethod
    def validate_price(cls, value: Decimal) -> Decimal:
        return _validate_price(value)


class BillingProductStatusRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: BillingProductStatus


class BillingProductPublicResponse(BaseModel):
    id: int
    product_code: str
    service_code: str
    service_name: str
    supplier_name: str
    name: str
    description: str | None
    billing_mode: BillingMode
    price: Decimal
    currency: str


class BillingProductAdminResponse(BillingProductPublicResponse):
    sort_order: int
    status: BillingProductStatus
    created_by: int
    updated_by: int
    created_at: datetime
    updated_at: datetime


class BillingProductListResponse(BaseModel):
    items: list[BillingProductAdminResponse]
    total: int
    page: int
    page_size: int
