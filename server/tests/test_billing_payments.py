import json
import unittest
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from itertools import count

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.billing_order import BillingOrder
from app.models.billing_product import BillingProduct
from app.models.consumption_import import ConsumptionImportBatch, ConsumptionImportRow
from app.models.consumption_record import ConsumptionRecord
from app.models.mock_payment_transaction import MockPaymentTransaction
from app.models.payment_notification import PaymentNotification
from app.models.payment_reconciliation import PaymentReconciliationBatch, PaymentReconciliationItem
from app.models.payment_transaction import PaymentTransaction
from app.models.prepaid_ledger_entry import PrepaidLedgerEntry
from app.models.site_user import SiteUser
from app.models.wallet_ledger_entry import WalletLedgerEntry
from app.models.wallet_payment_transaction import WalletPaymentTransaction
from app.models.wallet_recharge_order import WalletRechargeOrder
from app.repositories.payment import get_mock_payment_transaction_by_provider_tx, get_pending_order_payment_transaction
from app.schemas.billing_order import BillingOrderCreateRequest
from app.schemas.payment import MockPaymentNotificationMode, PaymentReconciliationCreateRequest, PaymentTransactionStatus
from app.schemas.wallet import WalletPaymentMethod, WalletRechargeLaunchRequest
from app.services.billing_order import BillingOrderConflictError, cancel_order, create_order
from app.services.billing_payment import (
    PaymentConflictError,
    PaymentNotificationUnauthorizedError,
    PaymentValidationError,
    attach_payment_transactions_to_order_response,
    generate_payment_no,
    get_order_payment_status,
    process_payment_notification,
    reconciliation_batch_to_response,
    run_reconciliation,
    should_register_mock_payment_routes,
    start_order_payment,
    validate_payment_settings,
)
from app.services.mock_payment_provider import (
    build_signed_notification_payload,
    complete_mock_payment,
    flush_due_mock_notifications,
)
from app.services.wallet import get_wallet_ledger_records, get_wallet_recharge_payment_status, get_wallet_summary, get_wallet_transactions, launch_wallet_recharge


UTC = timezone.utc


class BillingPaymentServiceTests(unittest.TestCase):
    request_counter = count(1)

    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        for table in (
            SiteUser.__table__,
            BillingProduct.__table__,
            BillingOrder.__table__,
            PaymentTransaction.__table__,
            PaymentNotification.__table__,
            PaymentReconciliationBatch.__table__,
            PaymentReconciliationItem.__table__,
            MockPaymentTransaction.__table__,
            ConsumptionImportBatch.__table__,
            ConsumptionImportRow.__table__,
            ConsumptionRecord.__table__,
            PrepaidLedgerEntry.__table__,
            WalletRechargeOrder.__table__,
            WalletPaymentTransaction.__table__,
            WalletLedgerEntry.__table__,
        ):
            table.create(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.now = datetime.now(UTC).replace(microsecond=0)

        self._original_payment_provider = __import__("app.services.billing_payment", fromlist=["settings"]).settings.payment_provider
        self._original_mock_enabled = __import__("app.services.billing_payment", fromlist=["settings"]).settings.mock_payment_enabled
        self._original_secret = __import__("app.services.billing_payment", fromlist=["settings"]).settings.mock_payment_signing_secret
        self._original_app_env = __import__("app.services.billing_payment", fromlist=["settings"]).settings.app_env

        from app.core.config import settings
        import app.services.mock_payment_provider as mock_module

        self._original_mock_session_local = mock_module.SessionLocal
        settings.payment_provider = "mock"
        settings.mock_payment_enabled = True
        settings.mock_payment_signing_secret = "unit-test-mock-secret"
        settings.app_env = "test"
        mock_module.SessionLocal = self.Session

        self.user = self._create_user(1, "13900000001", "用户一")
        self.monthly = self._create_product(1, "MONTHLY", Decimal("299.00"), "AI_MONTHLY_299")
        self.prepaid = self._create_product(2, "PREPAID", Decimal("1000.00"), "AI_PREPAID_1000")

    def tearDown(self):
        from app.core.config import settings

        settings.payment_provider = self._original_payment_provider
        settings.mock_payment_enabled = self._original_mock_enabled
        settings.mock_payment_signing_secret = self._original_secret
        settings.app_env = self._original_app_env
        import app.services.mock_payment_provider as mock_module

        mock_module.SessionLocal = self._original_mock_session_local
        self.db.close()
        self.engine.dispose()

    def _create_user(self, user_id: int, phone: str, name: str) -> SiteUser:
        item = SiteUser(
            id=user_id,
            phone=phone,
            password_hash="test",
            name=name,
            auth_source="local",
            status=1,
            created_at=datetime(2026, 1, 1),
            updated_at=datetime(2026, 1, 1),
        )
        self.db.add(item)
        self.db.commit()
        return item

    def _create_product(self, product_id: int, mode: str, price: Decimal, code: str) -> BillingProduct:
        item = BillingProduct(
            id=product_id,
            product_code=code,
            service_code="AI_COMPUTE",
            service_name="AI 算力服务",
            supplier_name="示例供应商",
            name=f"商品 {code}",
            billing_mode=mode,
            price=price,
            currency="CNY",
            sort_order=product_id,
            status="ON_SALE",
            created_by=1,
            updated_by=1,
            created_at=datetime(2026, 1, 1),
            updated_at=datetime(2026, 1, 1),
        )
        self.db.add(item)
        self.db.commit()
        return item

    def _create_order(self, product_id: int, month_count: int | None = None) -> BillingOrder:
        payload = BillingOrderCreateRequest(product_id=product_id, month_count=month_count)
        created = create_order(
            self.db,
            self.user.id,
            payload,
            f"key-{product_id}-{month_count}-{next(self.request_counter)}",
            now=self.now,
        )
        return self.db.get(BillingOrder, created.id)

    def _start_payment(self, order: BillingOrder):
        result = start_order_payment(self.db, order.id, self.user.id, "http://127.0.0.1:8000/")
        payment = self.db.query(PaymentTransaction).filter(PaymentTransaction.payment_no == result.payment_no).first()
        mock_tx = self.db.query(MockPaymentTransaction).filter(MockPaymentTransaction.payment_no == result.payment_no).first()
        self.assertIsNotNone(payment)
        self.assertIsNotNone(mock_tx)
        return payment, mock_tx

    def _notify(self, mock_tx: MockPaymentTransaction, mutate=None):
        payload_bytes, headers = build_signed_notification_payload(mock_tx)
        if mutate:
            payload_dict = json.loads(payload_bytes.decode("utf-8"))
            headers_dict = dict(headers)
            payload_dict, headers_dict = mutate(payload_dict, headers_dict)
            body = json.dumps(payload_dict, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            timestamp = headers_dict["X-Mockpay-Timestamp"]
            notification_id = headers_dict["X-Mockpay-Notification-Id"]
            import hmac, hashlib
            from app.core.config import settings
            message = timestamp.encode("utf-8") + b"\n" + notification_id.encode("utf-8") + b"\n" + body
            headers_dict["X-Mockpay-Signature"] = hmac.new(
                settings.mock_payment_signing_secret.encode("utf-8"),
                message,
                hashlib.sha256,
            ).hexdigest()
            payload_bytes = body
            headers = headers_dict
        process_payment_notification(self.db, "mock", headers, payload_bytes)

    def test_start_payment_keeps_amount_and_reuses_pending_transaction(self):
        order = self._create_order(self.monthly.id, 2)
        first, mock_tx = self._start_payment(order)
        second = start_order_payment(self.db, order.id, self.user.id, "http://127.0.0.1:8000/")
        self.assertEqual(first.payment_no, second.payment_no)
        self.assertEqual(first.amount, Decimal("598.00"))
        self.assertEqual(self.db.query(PaymentTransaction).count(), 1)
        self.assertTrue(mock_tx.checkout_token)

    def test_success_notification_marks_order_paid_and_duplicate_notification_is_idempotent(self):
        order = self._create_order(self.prepaid.id)
        _, mock_tx = self._start_payment(order)
        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        payload_bytes, headers = build_signed_notification_payload(mock_tx)
        process_payment_notification(self.db, "mock", headers, payload_bytes)
        process_payment_notification(self.db, "mock", headers, payload_bytes)
        refreshed = self.db.get(BillingOrder, order.id)
        payment = self.db.query(PaymentTransaction).one()
        self.assertEqual(refreshed.status, "PAID")
        self.assertEqual(payment.status, "SUCCESS")
        self.assertEqual(self.db.query(PaymentNotification).count(), 1)
        self.assertEqual(self.db.query(PrepaidLedgerEntry).count(), 1)
        # External prepaid purchase credits service prepaid ledger only, not cash wallet
        self.assertEqual(self.db.query(WalletLedgerEntry).count(), 0)
        self.assertEqual(refreshed.payment_channel, "EXTERNAL")

    def test_wallet_recharge_payment_success_updates_wallet_summary(self):
        launch = launch_wallet_recharge(
            self.db,
            self.user.id,
            WalletRechargeLaunchRequest(amount=Decimal("88.00"), payment_method=WalletPaymentMethod.ALIPAY),
            "wallet-key-1",
            "http://127.0.0.1:8000/",
        )
        self.assertTrue(launch.checkout_url)
        recharge = self.db.get(WalletRechargeOrder, launch.recharge.id)
        payment = self.db.query(WalletPaymentTransaction).filter(WalletPaymentTransaction.recharge_order_id == recharge.id).one()
        mock_tx = self.db.query(MockPaymentTransaction).filter(MockPaymentTransaction.payment_no == payment.payment_no).one()

        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(mock_tx)

        status_data = get_wallet_recharge_payment_status(self.db, recharge.id, self.user.id)
        summary = get_wallet_summary(self.db, self.user.id)
        self.assertEqual(status_data.recharge_status, "PAID")
        self.assertEqual(summary.current_balance, Decimal("88.00"))
        self.assertEqual(summary.total_recharged, Decimal("88.00"))
        self.assertEqual(summary.total_consumed, Decimal("0.00"))

    def test_wallet_ledger_records_return_recharge_entry(self):
        launch = launch_wallet_recharge(
            self.db,
            self.user.id,
            WalletRechargeLaunchRequest(amount=Decimal("66.00"), payment_method=WalletPaymentMethod.WECHAT),
            "wallet-key-ledger",
            "http://127.0.0.1:8000/",
        )
        recharge = self.db.get(WalletRechargeOrder, launch.recharge.id)
        payment = self.db.query(WalletPaymentTransaction).filter(WalletPaymentTransaction.recharge_order_id == recharge.id).one()
        mock_tx = self.db.query(MockPaymentTransaction).filter(MockPaymentTransaction.payment_no == payment.payment_no).one()

        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(mock_tx)

        records = get_wallet_ledger_records(self.db, self.user.id, 1, 10)
        self.assertEqual(records.total, 1)
        self.assertEqual(records.items[0].entry_type.value, "CREDIT")
        self.assertEqual(records.items[0].source_type.value, "RECHARGE_ORDER")
        self.assertEqual(records.items[0].amount, Decimal("66.00"))
        self.assertIn("钱包充值", records.items[0].title)

    def test_paid_external_monthly_does_not_appear_in_wallet_transactions(self):
        order = self._create_order(self.monthly.id, 1)
        _, mock_tx = self._start_payment(order)
        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(mock_tx)

        transactions = get_wallet_transactions(self.db, self.user.id, 1, 10)
        summary = get_wallet_summary(self.db, self.user.id)

        self.assertEqual(transactions.total, 0)
        self.assertEqual(summary.current_balance, Decimal("0.00"))
        self.assertEqual(summary.total_consumed, Decimal("0.00"))
        refreshed = self.db.get(BillingOrder, order.id)
        self.assertEqual(refreshed.status, "PAID")
        self.assertEqual(refreshed.payment_channel, "EXTERNAL")

    def test_wallet_balance_can_pay_order_and_is_idempotent(self):
        from app.schemas.payment import OrderPaymentMethod
        from app.services.billing_payment import PaymentConflictError

        # Fund wallet via recharge
        launch = launch_wallet_recharge(
            self.db,
            self.user.id,
            WalletRechargeLaunchRequest(amount=Decimal("500.00"), payment_method=WalletPaymentMethod.ALIPAY),
            "wallet-fund-pay",
            "http://127.0.0.1:8000/",
        )
        recharge = self.db.get(WalletRechargeOrder, launch.recharge.id)
        payment = self.db.query(WalletPaymentTransaction).filter(WalletPaymentTransaction.recharge_order_id == recharge.id).one()
        mock_tx = self.db.query(MockPaymentTransaction).filter(MockPaymentTransaction.payment_no == payment.payment_no).one()
        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(mock_tx)

        order = self._create_order(self.monthly.id, 1)  # 299.00
        result = start_order_payment(
            self.db, order.id, self.user.id, "http://127.0.0.1:8000/", OrderPaymentMethod.WALLET
        )
        self.assertEqual(result.payment_method, OrderPaymentMethod.WALLET)
        self.assertEqual(result.status, PaymentTransactionStatus.SUCCESS)
        self.assertEqual(result.checkout_url, "")
        refreshed = self.db.get(BillingOrder, order.id)
        self.assertEqual(refreshed.status, "PAID")
        self.assertEqual(refreshed.payment_channel, "WALLET")
        summary = get_wallet_summary(self.db, self.user.id)
        self.assertEqual(summary.current_balance, Decimal("201.00"))
        self.assertEqual(summary.total_consumed, Decimal("299.00"))
        self.assertEqual(self.db.query(WalletLedgerEntry).filter(WalletLedgerEntry.source_type == "ORDER_PAYMENT").count(), 1)
        self.assertEqual(self.db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order.id).count(), 0)

        # Idempotent second call
        again = start_order_payment(
            self.db, order.id, self.user.id, "http://127.0.0.1:8000/", OrderPaymentMethod.WALLET
        )
        self.assertEqual(again.status, PaymentTransactionStatus.SUCCESS)
        self.assertEqual(self.db.query(WalletLedgerEntry).filter(WalletLedgerEntry.source_type == "ORDER_PAYMENT").count(), 1)
        self.assertEqual(get_wallet_summary(self.db, self.user.id).current_balance, Decimal("201.00"))

        # Insufficient balance
        expensive = self._create_order(self.prepaid.id)  # 1000.00
        with self.assertRaises(PaymentConflictError):
            start_order_payment(
                self.db, expensive.id, self.user.id, "http://127.0.0.1:8000/", OrderPaymentMethod.WALLET
            )
        self.assertEqual(self.db.get(BillingOrder, expensive.id).status, "PENDING_PAYMENT")

    def test_wallet_pay_prepaid_credits_service_balance_only(self):
        from app.schemas.payment import OrderPaymentMethod

        launch = launch_wallet_recharge(
            self.db,
            self.user.id,
            WalletRechargeLaunchRequest(amount=Decimal("1000.00"), payment_method=WalletPaymentMethod.WECHAT),
            "wallet-fund-prepaid",
            "http://127.0.0.1:8000/",
        )
        recharge = self.db.get(WalletRechargeOrder, launch.recharge.id)
        payment = self.db.query(WalletPaymentTransaction).filter(WalletPaymentTransaction.recharge_order_id == recharge.id).one()
        mock_tx = self.db.query(MockPaymentTransaction).filter(MockPaymentTransaction.payment_no == payment.payment_no).one()
        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(mock_tx)

        order = self._create_order(self.prepaid.id)
        start_order_payment(self.db, order.id, self.user.id, "http://127.0.0.1:8000/", OrderPaymentMethod.WALLET)
        self.assertEqual(self.db.query(PrepaidLedgerEntry).filter(PrepaidLedgerEntry.entry_type == "CREDIT").count(), 1)
        self.assertEqual(self.db.query(WalletLedgerEntry).filter(WalletLedgerEntry.source_type == "ORDER_PAYMENT").count(), 1)
        self.assertEqual(self.db.query(WalletLedgerEntry).filter(WalletLedgerEntry.source_type == "PAID_ORDER").count(), 0)
        self.assertEqual(get_wallet_summary(self.db, self.user.id).current_balance, Decimal("0.00"))
        txs = get_wallet_transactions(self.db, self.user.id, 1, 10)
        self.assertEqual(txs.total, 2)
        types = {item.transaction_type.value for item in txs.items}
        self.assertEqual(types, {"RECHARGE", "ORDER_PAYMENT"})

    def test_failed_then_retry_success_creates_new_payment_attempt(self):
        order = self._create_order(self.prepaid.id)
        _, mock_tx = self._start_payment(order)
        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.FAILED, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(mock_tx)
        failed_order = self.db.get(BillingOrder, order.id)
        self.assertEqual(failed_order.status, "PAYMENT_FAILED")

        second = start_order_payment(self.db, order.id, self.user.id, "http://127.0.0.1:8000/")
        self.assertEqual(self.db.query(PaymentTransaction).count(), 2)
        new_mock = self.db.query(MockPaymentTransaction).filter(MockPaymentTransaction.payment_no == second.payment_no).first()
        complete_mock_payment(self.db, new_mock.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(new_mock)
        final_order = self.db.get(BillingOrder, order.id)
        self.assertEqual(final_order.status, "PAID")

    def test_delayed_notification_and_no_notification_query_compensation(self):
        delayed_order = self._create_order(self.prepaid.id)
        _, delayed_mock = self._start_payment(delayed_order)
        complete_mock_payment(self.db, delayed_mock.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.DELAYED)
        delayed_mock.notification_due_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1)
        self.db.commit()
        flush_due_mock_notifications()
        self.assertEqual(self.db.get(BillingOrder, delayed_order.id).status, "PAID")

        query_order = self._create_order(self.prepaid.id)
        _, query_mock = self._start_payment(query_order)
        complete_mock_payment(self.db, query_mock.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        status_result = get_order_payment_status(self.db, query_order.id, self.user.id)
        self.assertEqual(status_result.order_status, "PAID")

    def test_invalid_signature_expired_timestamp_amount_mismatch_and_unknown_payment_are_rejected(self):
        order = self._create_order(self.prepaid.id)
        _, mock_tx = self._start_payment(order)
        complete_mock_payment(self.db, mock_tx.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()

        payload_bytes, headers = build_signed_notification_payload(mock_tx)
        bad_headers = dict(headers)
        bad_headers["X-Mockpay-Signature"] = "bad-signature"
        with self.assertRaises(PaymentNotificationUnauthorizedError):
            process_payment_notification(self.db, "mock", bad_headers, payload_bytes)

        def expire(payload, header_values):
            header_values["X-Mockpay-Timestamp"] = str(int((datetime.now(UTC) - timedelta(minutes=10)).timestamp()))
            return payload, header_values

        with self.assertRaises(PaymentNotificationUnauthorizedError):
            self._notify(mock_tx, mutate=expire)

        def wrong_amount(payload, header_values):
            payload["amount"] = "999.99"
            return payload, header_values

        with self.assertRaises(PaymentValidationError):
            self._notify(mock_tx, mutate=wrong_amount)

        def unknown_payment(payload, header_values):
            payload["payment_no"] = "PAY_UNKNOWN"
            payload["provider_transaction_no"] = "MPT_UNKNOWN"
            return payload, header_values

        with self.assertRaises(PaymentValidationError):
            self._notify(mock_tx, mutate=unknown_payment)

    def test_cancel_after_provider_success_conflicts_and_late_success_overrides_canceled(self):
        paid_order = self._create_order(self.prepaid.id)
        _, paid_mock = self._start_payment(paid_order)
        complete_mock_payment(self.db, paid_mock.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        with self.assertRaises(BillingOrderConflictError):
            cancel_order(self.db, paid_order.id, self.user.id)
        self.assertEqual(self.db.get(BillingOrder, paid_order.id).status, "PAID")

        late_order = self._create_order(self.prepaid.id)
        _, late_mock = self._start_payment(late_order)
        canceled = cancel_order(self.db, late_order.id, self.user.id)
        self.assertEqual(canceled.status.value, "CANCELED")
        complete_mock_payment(self.db, late_mock.checkout_token, PaymentTransactionStatus.SUCCESS, MockPaymentNotificationMode.NONE)
        self.db.commit()
        self._notify(late_mock)
        self.assertEqual(self.db.get(BillingOrder, late_order.id).status, "PAID")

    def test_reconciliation_covers_all_five_result_types(self):
        statement_day = date(2026, 7, 14)
        order = self._create_order(self.prepaid.id)
        payment, mock_tx = self._start_payment(order)
        payment.status = "SUCCESS"
        payment.provider_completed_at = datetime(2026, 7, 14, 10, 0, 0)
        mock_tx.status = "SUCCESS"
        mock_tx.completed_at = datetime(2026, 7, 14, 10, 0, 0)

        amount_order = self._create_order(self.prepaid.id)
        amount_payment, amount_mock = self._start_payment(amount_order)
        amount_payment.status = "SUCCESS"
        amount_payment.provider_completed_at = datetime(2026, 7, 14, 11, 0, 0)
        amount_mock.status = "SUCCESS"
        amount_mock.amount = Decimal("888.00")
        amount_mock.completed_at = datetime(2026, 7, 14, 11, 0, 0)

        status_order = self._create_order(self.prepaid.id)
        status_payment, status_mock = self._start_payment(status_order)
        status_payment.status = "FAILED"
        status_payment.provider_completed_at = datetime(2026, 7, 14, 12, 0, 0)
        status_mock.status = "SUCCESS"
        status_mock.completed_at = datetime(2026, 7, 14, 12, 0, 0)

        system_only = PaymentTransaction(
          payment_no=generate_payment_no(self.now),
          order_id=order.id,
          order_no=order.order_no,
          provider="MOCK",
          provider_transaction_no="SYSONLY001",
          amount=Decimal("500.00"),
          currency="CNY",
          status="FAILED",
          created_at=datetime(2026, 7, 14, 13, 0, 0),
          updated_at=datetime(2026, 7, 14, 13, 0, 0),
        )
        provider_only = MockPaymentTransaction(
          payment_no="PAYPROVIDERONLY01",
          order_no="OPC_PROVIDER_ONLY",
          provider_transaction_no="MPTPROVIDERONLY01",
          checkout_token="provider-only-token",
          subject="平台单边",
          amount=Decimal("321.00"),
          currency="CNY",
          notify_url="http://127.0.0.1/api/payment/notifications/mock",
          return_url="http://127.0.0.1/orders/payment-result?order_id=999",
          status="SUCCESS",
          completed_at=datetime(2026, 7, 14, 14, 0, 0),
          notification_mode="NONE",
          notification_status="SKIPPED",
          created_at=datetime(2026, 7, 14, 14, 0, 0),
          updated_at=datetime(2026, 7, 14, 14, 0, 0),
        )
        self.db.add(system_only)
        self.db.add(provider_only)
        self.db.commit()

        batch = run_reconciliation(
            self.db,
            admin_user_id=1,
            payload=PaymentReconciliationCreateRequest(provider="MOCK", statement_date=statement_day),
        )
        self.assertEqual(batch.matched_count, 1)
        self.assertEqual(batch.amount_mismatch_count, 1)
        self.assertEqual(batch.status_mismatch_count, 1)
        self.assertEqual(batch.system_only_count, 1)
        self.assertEqual(batch.provider_only_count, 1)

    def test_production_environment_cannot_enable_mock(self):
        from app.core.config import settings

        settings.app_env = "production"
        settings.payment_provider = "mock"
        settings.mock_payment_enabled = True
        with self.assertRaises(RuntimeError):
            validate_payment_settings()

    def test_development_environment_allows_mock_when_explicitly_enabled(self):
        from app.core.config import settings

        settings.app_env = "development"
        settings.payment_provider = "mock"
        settings.mock_payment_enabled = True
        settings.mock_payment_signing_secret = "unit-test-secret"

        validate_payment_settings()
        self.assertTrue(should_register_mock_payment_routes())


if __name__ == "__main__":
    unittest.main()
