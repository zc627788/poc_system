from __future__ import annotations

from datetime import date
from typing import Iterable, Protocol

from app.schemas.prepaid_billing import ConsumptionSourceRecord


class ConsumptionProvider(Protocol):
    def fetch_records(self, business_date: date) -> Iterable[ConsumptionSourceRecord]: ...
