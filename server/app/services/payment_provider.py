from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from typing import Mapping, Protocol

from app.schemas.payment import PaymentTransactionStatus


@dataclass(slots=True)
class CreatePaymentRequest:
    payment_no: str
    order_no: str
    amount: Decimal
    currency: str
    subject: str
    notify_url: str
    return_url: str
    api_base_url: str


@dataclass(slots=True)
class CreatePaymentResult:
    provider: str
    provider_transaction_no: str
    status: PaymentTransactionStatus
    checkout_url: str


@dataclass(slots=True)
class PaymentQueryResult:
    provider: str
    provider_transaction_no: str
    payment_no: str
    order_no: str
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    completed_at: datetime | None
    failure_code: str | None = None
    failure_message: str | None = None


@dataclass(slots=True)
class ClosePaymentResult:
    provider: str
    provider_transaction_no: str
    payment_no: str
    order_no: str
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    completed_at: datetime | None
    failure_code: str | None = None
    failure_message: str | None = None


@dataclass(slots=True)
class VerifiedPaymentNotification:
    notification_id: str
    provider: str
    provider_transaction_no: str
    payment_no: str
    order_no: str
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    completed_at: datetime | None
    failure_code: str | None = None
    failure_message: str | None = None


@dataclass(slots=True)
class StatementEntry:
    payment_no: str
    provider_transaction_no: str
    order_no: str
    amount: Decimal
    currency: str
    status: PaymentTransactionStatus
    completed_at: datetime | None


class PaymentProvider(Protocol):
    provider_code: str

    def create_payment(self, request: CreatePaymentRequest) -> CreatePaymentResult: ...

    def query_payment(self, provider_transaction_no: str) -> PaymentQueryResult: ...

    def close_payment(self, provider_transaction_no: str) -> ClosePaymentResult: ...

    def verify_notification(self, headers: Mapping[str, str], body: bytes) -> VerifiedPaymentNotification: ...

    def download_statement(self, statement_date: date) -> list[StatementEntry]: ...
