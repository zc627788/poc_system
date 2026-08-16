import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


CREDIT_CODE_PATTERN = re.compile(r"^[0-9A-Z]{18}$")
PHONE_PATTERN = re.compile(r"^1[3-9]\d{9}$")
ACCOUNT_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9_]{7,31}$")


def has_valid_mainland_id_card_checksum(value: str) -> bool:
    if len(value) != 18 or not value[:17].isdigit() or value[-1] not in "0123456789X":
        return False
    weights = (7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2)
    checks = "10X98765432"
    return checks[sum(int(char) * weight for char, weight in zip(value[:17], weights)) % 11] == value[-1]


class TrustedDataspaceStatus(str, Enum):
    SUBMITTING = "SUBMITTING"
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    SUBMIT_FAILED = "SUBMIT_FAILED"
    SUBMISSION_UNKNOWN = "SUBMISSION_UNKNOWN"


class TrustedDataspaceRegistrationSubmitRequest(BaseModel):
    dept_name: str = Field(min_length=2, max_length=255)
    credit_code: str
    legal_person_name: str = Field(min_length=1, max_length=128)
    legal_person_id_card: str
    legal_person_phone: str
    account: str
    privacy_consent: bool

    @field_validator("dept_name", "legal_person_name")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("credit_code")
    @classmethod
    def validate_credit_code(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not CREDIT_CODE_PATTERN.fullmatch(normalized):
            raise ValueError("统一社会信用代码必须为18位大写字母或数字")
        return normalized

    @field_validator("legal_person_id_card")
    @classmethod
    def normalize_id_card(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not has_valid_mainland_id_card_checksum(normalized):
            raise ValueError("法人身份证号码校验位不正确")
        return normalized

    @field_validator("legal_person_phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        normalized = value.strip()
        if not PHONE_PATTERN.fullmatch(normalized):
            raise ValueError("法人手机号必须为11位有效手机号")
        return normalized

    @field_validator("account")
    @classmethod
    def validate_account(cls, value: str) -> str:
        normalized = value.strip()
        if not ACCOUNT_PATTERN.fullmatch(normalized):
            raise ValueError("登录账号须为8-32位，以英文字母开头，仅包含字母、数字或下划线")
        return normalized

    @field_validator("privacy_consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("提交前必须同意信息授权说明")
        return value


class TrustedDataspaceRegistrationMaskedResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: TrustedDataspaceStatus
    dept_name: str
    credit_code_masked: str
    legal_person_name: str
    legal_person_id_card_masked: str
    legal_person_phone_masked: str
    account: str
    seq_no: str | None
    provider_message: str | None
    last_error_message: str | None
    can_retry: bool
    portal_url: str
    submitted_at: datetime | None
    completed_at: datetime | None
    last_synced_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TrustedDataspaceRegistrationResponse(TrustedDataspaceRegistrationMaskedResponse):
    credit_code: str
    legal_person_phone: str


class AdminTrustedDataspaceRegistrationResponse(TrustedDataspaceRegistrationMaskedResponse):
    site_user_id: int
    site_user_name: str
    site_user_phone_masked: str


class AdminTrustedDataspaceRegistrationListResponse(BaseModel):
    items: list[AdminTrustedDataspaceRegistrationResponse]
    total: int
    page: int
    page_size: int
    sync_warning: str | None = None
