from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import string
import threading
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Mapping

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.mock_payment_transaction import MockPaymentTransaction
from app.repositories.payment import (
    get_mock_payment_transaction_by_provider_tx,
    get_mock_payment_transaction_by_token,
    list_due_mock_payment_transactions,
    list_mock_statement_transactions,
)
from app.schemas.payment import MockPaymentNotificationMode, PaymentTransactionStatus
from app.services.payment_provider import (
    ClosePaymentResult,
    CreatePaymentRequest,
    CreatePaymentResult,
    PaymentProvider,
    PaymentQueryResult,
    StatementEntry,
    VerifiedPaymentNotification,
)


UTC = timezone.utc
SHANGHAI_TZ = timezone(timedelta(hours=8), name="Asia/Shanghai")
PROVIDER_CODE = "MOCK"
MOCK_PROVIDER_TX_PREFIX = "MPT"
CHECKOUT_TOKEN_ALPHABET = string.ascii_letters + string.digits
PROVIDER_TX_ALPHABET = string.ascii_uppercase + string.digits
NOTIFICATION_DELAY_SECONDS = 4
MOCK_NOTIFICATION_HEADERS = {
    "timestamp": "X-Mockpay-Timestamp",
    "notification_id": "X-Mockpay-Notification-Id",
    "signature": "X-Mockpay-Signature",
}


class MockPaymentProviderError(ValueError):
    pass


class MockPaymentSignatureError(MockPaymentProviderError):
    pass


class MockPaymentProvider(PaymentProvider):
    provider_code = PROVIDER_CODE

    def __init__(self, db: Session):
        self.db = db

    def create_payment(self, request: CreatePaymentRequest) -> CreatePaymentResult:
        now = datetime.now(UTC).replace(tzinfo=None)
        provider_transaction_no = f"{MOCK_PROVIDER_TX_PREFIX}{now.strftime('%Y%m%d%H%M%S')}{_random_upper(8)}"
        checkout_token = secrets.token_urlsafe(24)
        item = MockPaymentTransaction(
            payment_no=request.payment_no,
            order_no=request.order_no,
            provider_transaction_no=provider_transaction_no,
            checkout_token=checkout_token,
            subject=request.subject[:128],
            amount=request.amount,
            currency=request.currency,
            notify_url=request.notify_url,
            return_url=request.return_url,
            status=PaymentTransactionStatus.PENDING.value,
            notification_mode=MockPaymentNotificationMode.IMMEDIATE.value,
            notification_status="PENDING",
            created_at=now,
            updated_at=now,
        )
        self.db.add(item)
        self.db.flush()
        checkout_url = f"{request.api_base_url.rstrip('/')}/api/mock-payment/checkout/{checkout_token}"
        return CreatePaymentResult(
            provider=self.provider_code,
            provider_transaction_no=provider_transaction_no,
            status=PaymentTransactionStatus.PENDING,
            checkout_url=checkout_url,
        )

    def query_payment(self, provider_transaction_no: str) -> PaymentQueryResult:
        flush_due_mock_notifications()
        item = get_mock_payment_transaction_by_provider_tx(self.db, provider_transaction_no)
        if item is None:
            raise MockPaymentProviderError("平台交易不存在")
        return _to_query_result(item)

    def close_payment(self, provider_transaction_no: str) -> ClosePaymentResult:
        flush_due_mock_notifications()
        item = get_mock_payment_transaction_by_provider_tx(self.db, provider_transaction_no, for_update=True)
        if item is None:
            raise MockPaymentProviderError("平台交易不存在")
        now = datetime.now(UTC).replace(tzinfo=None)
        if item.status == PaymentTransactionStatus.PENDING.value:
            item.status = PaymentTransactionStatus.CLOSED.value
            item.completed_at = now
            item.notification_status = "SKIPPED"
            item.notification_due_at = None
            item.updated_at = now
            self.db.flush()
        return ClosePaymentResult(
            provider=self.provider_code,
            provider_transaction_no=item.provider_transaction_no,
            payment_no=item.payment_no,
            order_no=item.order_no,
            amount=item.amount,
            currency=item.currency,
            status=PaymentTransactionStatus(item.status),
            completed_at=_utc_value(item.completed_at),
            failure_code=item.failure_code,
            failure_message=item.failure_message,
        )

    def verify_notification(self, headers: Mapping[str, str], body: bytes) -> VerifiedPaymentNotification:
        timestamp = _read_header(headers, MOCK_NOTIFICATION_HEADERS["timestamp"]).strip()
        notification_id = _read_header(headers, MOCK_NOTIFICATION_HEADERS["notification_id"]).strip()
        signature = _read_header(headers, MOCK_NOTIFICATION_HEADERS["signature"]).strip()
        if not timestamp or not notification_id or not signature:
            raise MockPaymentSignatureError("通知签名头缺失")

        try:
            timestamp_value = int(timestamp)
        except ValueError as exc:
            raise MockPaymentSignatureError("通知时间戳不合法") from exc

        now_ts = int(datetime.now(UTC).timestamp())
        if abs(now_ts - timestamp_value) > 300:
            raise MockPaymentSignatureError("通知时间戳已过期")

        expected_signature = _sign_notification(timestamp, notification_id, body)
        if not hmac.compare_digest(expected_signature, signature):
            raise MockPaymentSignatureError("通知签名无效")

        try:
            payload = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise MockPaymentSignatureError("通知内容不是合法 JSON") from exc

        try:
            status = PaymentTransactionStatus(str(payload["status"]).strip().upper())
            amount = Decimal(str(payload["amount"]))
            currency = str(payload["currency"]).strip().upper()
            provider_transaction_no = str(payload["provider_transaction_no"]).strip()
            payment_no = str(payload["payment_no"]).strip()
            order_no = str(payload["order_no"]).strip()
        except (KeyError, ValueError) as exc:
            raise MockPaymentSignatureError("通知字段不完整") from exc

        completed_at_raw = payload.get("completed_at")
        completed_at = _parse_iso_datetime(completed_at_raw) if completed_at_raw else None
        return VerifiedPaymentNotification(
            notification_id=notification_id,
            provider=self.provider_code,
            provider_transaction_no=provider_transaction_no,
            payment_no=payment_no,
            order_no=order_no,
            amount=amount.quantize(Decimal("0.01")),
            currency=currency,
            status=status,
            completed_at=completed_at,
            failure_code=_normalize_text(payload.get("failure_code")),
            failure_message=_normalize_text(payload.get("failure_message")),
        )

    def download_statement(self, statement_date: date) -> list[StatementEntry]:
        flush_due_mock_notifications()
        return [_to_statement_entry(item) for item in list_mock_statement_transactions(self.db, statement_date)]


def build_mock_checkout_html(item: MockPaymentTransaction) -> str:
    amount = f"{Decimal(item.amount).quantize(Decimal('0.01'))}"
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mock 收银台</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f3f6fb;
      --card: #ffffff;
      --text: #14213d;
      --muted: #5b6783;
      --primary: #0f62fe;
      --success: #137333;
      --danger: #c5221f;
      --border: #d7def0;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at top left, #dbe8ff 0, var(--bg) 45%, #edf2fa 100%);
      font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      color: var(--text);
      padding: 20px;
    }}
    .card {{
      width: min(560px, 100%);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 18px 48px rgba(15, 34, 61, 0.12);
    }}
    .eyebrow {{
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }}
    h1 {{ margin: 10px 0 8px; font-size: 28px; }}
    p {{ margin: 0 0 18px; color: var(--muted); line-height: 1.7; }}
    dl {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin: 0 0 20px;
      padding: 0;
    }}
    .meta {{
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px 16px;
      background: #f8fbff;
    }}
    dt {{ font-size: 12px; color: var(--muted); margin-bottom: 6px; }}
    dd {{ margin: 0; font-size: 15px; font-weight: 600; word-break: break-all; }}
    .amount dd {{ font-size: 24px; color: var(--primary); }}
    .actions {{
      display: grid;
      gap: 12px;
    }}
    .controls {{
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }}
    select, button {{
      appearance: none;
      border-radius: 14px;
      border: 1px solid var(--border);
      font: inherit;
    }}
    select {{
      min-width: 190px;
      padding: 12px 14px;
      background: #fff;
    }}
    button {{
      cursor: pointer;
      padding: 13px 18px;
      font-weight: 700;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }}
    button:hover {{ transform: translateY(-1px); box-shadow: 0 8px 18px rgba(15, 98, 254, 0.16); }}
    .success {{ background: var(--success); color: #fff; border-color: var(--success); }}
    .danger {{ background: var(--danger); color: #fff; border-color: var(--danger); }}
    .status {{ min-height: 24px; color: var(--muted); font-size: 13px; }}
    @media (max-width: 640px) {{
      .card {{ padding: 22px; border-radius: 18px; }}
      dl {{ grid-template-columns: 1fr; }}
      .controls {{ flex-direction: column; align-items: stretch; }}
      button, select {{ width: 100%; }}
    }}
  </style>
</head>
<body>
  <main class="card">
    <span class="eyebrow">Mock Payment</span>
    <h1>模拟收银台</h1>
    <p>此页面仅用于开发和测试环境验证支付成功、失败、延迟通知和主动补查流程。</p>
    <dl>
      <div class="meta"><dt>商品摘要</dt><dd>{_escape_html(item.subject)}</dd></div>
      <div class="meta amount"><dt>应付金额</dt><dd>¥ {amount}</dd></div>
      <div class="meta"><dt>商户支付号</dt><dd>{_escape_html(item.payment_no)}</dd></div>
      <div class="meta"><dt>平台交易号</dt><dd>{_escape_html(item.provider_transaction_no)}</dd></div>
    </dl>
    <div class="actions">
      <div class="controls">
        <label for="notification-mode">通知模式</label>
        <select id="notification-mode" name="notification-mode">
          <option value="IMMEDIATE">即时通知</option>
          <option value="DELAYED">延迟通知</option>
          <option value="NONE">不发通知</option>
        </select>
      </div>
      <div class="controls">
        <button class="success" id="success-button" type="button">支付成功</button>
        <button class="danger" id="fail-button" type="button">支付失败</button>
      </div>
      <div class="status" id="status-text"></div>
    </div>
  </main>
  <script>
    const token = {json.dumps(item.checkout_token)};
    const statusText = document.getElementById("status-text");
    async function complete(result) {{
      const notificationMode = document.getElementById("notification-mode").value;
      statusText.textContent = "正在提交支付结果...";
      try {{
        const response = await fetch(`/api/mock-payment/checkout/${{token}}/complete`, {{
          method: "POST",
          headers: {{ "Content-Type": "application/json" }},
          body: JSON.stringify({{ result, notification_mode: notificationMode }})
        }});
        const payload = await response.json();
        if (!response.ok || !payload || payload.code !== 0) {{
          throw new Error(payload?.detail || payload?.message || "提交失败");
        }}
        window.location.assign(payload.data.return_url);
      }} catch (error) {{
        statusText.textContent = error instanceof Error ? error.message : "提交失败";
      }}
    }}
    document.getElementById("success-button").addEventListener("click", () => complete("SUCCESS"));
    document.getElementById("fail-button").addEventListener("click", () => complete("FAILED"));
  </script>
</body>
</html>"""


def complete_mock_payment(
    db: Session,
    checkout_token: str,
    result_status: PaymentTransactionStatus,
    notification_mode: MockPaymentNotificationMode,
) -> MockPaymentTransaction:
    item = get_mock_payment_transaction_by_token(db, checkout_token, for_update=True)
    if item is None:
        raise MockPaymentProviderError("收银台交易不存在")
    if item.status in {PaymentTransactionStatus.SUCCESS.value, PaymentTransactionStatus.FAILED.value}:
        return item
    if item.status == PaymentTransactionStatus.CLOSED.value and result_status != PaymentTransactionStatus.SUCCESS:
        return item

    now = datetime.now(UTC).replace(tzinfo=None)
    item.status = result_status.value
    item.completed_at = now
    item.notification_mode = notification_mode.value
    item.updated_at = now
    if result_status == PaymentTransactionStatus.FAILED:
        item.failure_code = "MOCK_USER_FAILED"
        item.failure_message = "用户在 Mock 收银台选择了支付失败"
    else:
        item.failure_code = None
        item.failure_message = None

    if notification_mode == MockPaymentNotificationMode.NONE:
        item.notification_status = "SKIPPED"
        item.notification_due_at = None
    elif notification_mode == MockPaymentNotificationMode.IMMEDIATE:
        item.notification_status = "PENDING"
        item.notification_due_at = now
    else:
        item.notification_status = "SCHEDULED"
        item.notification_due_at = now + timedelta(seconds=NOTIFICATION_DELAY_SECONDS)
    db.flush()
    return item


def trigger_mock_payment_notification(provider_transaction_no: str, mode: MockPaymentNotificationMode) -> None:
    _schedule_notification_if_needed(provider_transaction_no, mode)


def flush_due_mock_notifications() -> None:
    now = datetime.now(UTC).replace(tzinfo=None)
    db = SessionLocal()
    try:
        for item in list_due_mock_payment_transactions(db, now):
            _dispatch_mock_notification(db, item.provider_transaction_no)
        db.commit()
    finally:
        db.close()


def dispatch_mock_notification_now(provider_transaction_no: str) -> None:
    db = SessionLocal()
    try:
        _dispatch_mock_notification(db, provider_transaction_no)
        db.commit()
    finally:
        db.close()


def _dispatch_mock_notification(db: Session, provider_transaction_no: str) -> None:
    item = get_mock_payment_transaction_by_provider_tx(db, provider_transaction_no, for_update=True)
    if item is None:
        return
    if item.notification_status == "SENT":
        return
    if item.notification_status == "SKIPPED":
        return
    now = datetime.now(UTC).replace(tzinfo=None)
    if item.notification_due_at and item.notification_due_at > now:
        return

    from app.services.billing_payment import process_payment_notification_in_session

    payload, headers = build_signed_notification_payload(item)
    process_payment_notification_in_session(db, PROVIDER_CODE, headers, payload)
    item.notification_status = "SENT"
    item.notification_sent_at = now
    item.updated_at = now
    db.flush()


def build_signed_notification_payload(item: MockPaymentTransaction) -> tuple[bytes, dict[str, str]]:
    notification_id = f"MPN{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}{_random_upper(8)}"
    completed_at = _utc_value(item.completed_at).isoformat().replace("+00:00", "Z") if item.completed_at else None
    body = json.dumps(
        {
            "provider_transaction_no": item.provider_transaction_no,
            "payment_no": item.payment_no,
            "order_no": item.order_no,
            "amount": f"{Decimal(item.amount).quantize(Decimal('0.01'))}",
            "currency": item.currency,
            "status": item.status,
            "completed_at": completed_at,
            "failure_code": item.failure_code,
            "failure_message": item.failure_message,
        },
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    timestamp = str(int(datetime.now(UTC).timestamp()))
    signature = _sign_notification(timestamp, notification_id, body)
    return body, {
        MOCK_NOTIFICATION_HEADERS["timestamp"]: timestamp,
        MOCK_NOTIFICATION_HEADERS["notification_id"]: notification_id,
        MOCK_NOTIFICATION_HEADERS["signature"]: signature,
    }


def _sign_notification(timestamp: str, notification_id: str, body: bytes) -> str:
    message = timestamp.encode("utf-8") + b"\n" + notification_id.encode("utf-8") + b"\n" + body
    digest = hmac.new(settings.mock_payment_signing_secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return digest


def _to_query_result(item: MockPaymentTransaction) -> PaymentQueryResult:
    return PaymentQueryResult(
        provider=PROVIDER_CODE,
        provider_transaction_no=item.provider_transaction_no,
        payment_no=item.payment_no,
        order_no=item.order_no,
        amount=Decimal(item.amount).quantize(Decimal("0.01")),
        currency=item.currency,
        status=PaymentTransactionStatus(item.status),
        completed_at=_utc_value(item.completed_at),
        failure_code=item.failure_code,
        failure_message=item.failure_message,
    )


def _to_statement_entry(item: MockPaymentTransaction) -> StatementEntry:
    return StatementEntry(
        payment_no=item.payment_no,
        provider_transaction_no=item.provider_transaction_no,
        order_no=item.order_no,
        amount=Decimal(item.amount).quantize(Decimal("0.01")),
        currency=item.currency,
        status=PaymentTransactionStatus(item.status),
        completed_at=_utc_value(item.completed_at),
    )


def _schedule_notification_if_needed(provider_transaction_no: str, mode: MockPaymentNotificationMode) -> None:
    if mode == MockPaymentNotificationMode.NONE:
        return
    if mode == MockPaymentNotificationMode.IMMEDIATE:
        dispatch_mock_notification_now(provider_transaction_no)
        return

    timer = threading.Timer(NOTIFICATION_DELAY_SECONDS, dispatch_mock_notification_now, args=(provider_transaction_no,))
    timer.daemon = True
    timer.start()


def _random_upper(length: int) -> str:
    return "".join(secrets.choice(PROVIDER_TX_ALPHABET) for _ in range(length))


def _read_header(headers: Mapping[str, str], key: str) -> str:
    for header_key, value in headers.items():
        if header_key.lower() == key.lower():
            return value
    return ""


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _normalize_text(value: object) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _utc_value(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _escape_html(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )
