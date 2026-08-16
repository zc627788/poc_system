import unittest
from datetime import date, datetime, timezone
from decimal import Decimal

from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.billing_order import BillingOrder
from app.models.billing_product import BillingProduct
from app.models.payment_transaction import PaymentTransaction
from app.models.site_user import SiteUser
from app.schemas.billing_order import BillingOrderCreateRequest
from app.services.billing_order import (
    BillingOrderConflictError,
    BillingOrderNotFoundError,
    BillingOrderValidationError,
    calculate_service_period,
    cancel_order,
    create_order,
    get_order,
    normalize_idempotency_key,
)


class BillingOrderPeriodTests(unittest.TestCase):
    def test_month_end_cross_year_and_leap_year_rules(self):
        cases = [
            (date(2026, 1, 31), 1, date(2026, 2, 28)),
            (date(2028, 1, 31), 1, date(2028, 2, 29)),
            (date(2028, 2, 29), 12, date(2029, 2, 28)),
            (date(2026, 7, 13), 6, date(2027, 1, 12)),
            (date(2026, 12, 31), 1, date(2027, 1, 30)),
            (date(2026, 1, 1), 36, date(2028, 12, 31)),
        ]
        for start, months, expected_end in cases:
            with self.subTest(start=start, months=months):
                self.assertEqual(calculate_service_period(start, months), (start, expected_end))

    def test_rejects_month_count_outside_one_to_thirty_six(self):
        for month_count in (0, 37):
            with self.subTest(month_count=month_count), self.assertRaises(BillingOrderValidationError):
                calculate_service_period(date(2026, 1, 1), month_count)

    def test_requires_valid_idempotency_key(self):
        for value in (None, "", " ", "x" * 65):
            with self.subTest(value=value), self.assertRaises(BillingOrderValidationError):
                normalize_idempotency_key(value)


class BillingOrderServiceTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        SiteUser.__table__.create(engine)
        BillingProduct.__table__.create(engine)
        BillingOrder.__table__.create(engine)
        PaymentTransaction.__table__.create(engine)
        self.Session = sessionmaker(bind=engine)
        self.db = self.Session()
        self.user = self._create_user(1, "13900000001", "用户一")
        self.other_user = self._create_user(2, "13900000002", "用户二")
        self.monthly = self._create_product(1, "MONTHLY", Decimal("299.00"), "MONTHLY_299")
        self.prepaid = self._create_product(2, "PREPAID", Decimal("1000.00"), "PREPAID_1000")
        self.now = datetime(2026, 7, 13, 13, 30, 45, tzinfo=timezone.utc)

    def tearDown(self):
        self.db.close()

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

    def test_creates_monthly_order_with_server_calculated_amount_and_period(self):
        result = create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.monthly.id, month_count=6),
            "monthly-key",
            now=self.now,
        )
        self.assertEqual(result.order_amount, Decimal("1794.00"))
        self.assertEqual(result.unit_price, Decimal("299.00"))
        self.assertEqual(result.service_start_date, date(2026, 7, 13))
        self.assertEqual(result.service_end_date, date(2027, 1, 12))
        self.assertEqual(result.status.value, "PENDING_PAYMENT")
        self.assertRegex(result.order_no, r"^OPC20260713213045[A-Z0-9]{8}$")

    def test_creates_prepaid_order_without_period(self):
        result = create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.prepaid.id),
            "prepaid-key",
            now=self.now,
        )
        self.assertEqual(result.order_amount, Decimal("1000.00"))
        self.assertIsNone(result.month_count)
        self.assertIsNone(result.service_start_date)
        self.assertIsNone(result.service_end_date)

    def test_rejects_client_price_and_invalid_month_arguments(self):
        with self.assertRaises(ValidationError):
            BillingOrderCreateRequest.model_validate({"product_id": self.monthly.id, "month_count": 1, "order_amount": "0.01"})
        for payload, key in (
            (BillingOrderCreateRequest(product_id=self.monthly.id), "missing-month"),
            (BillingOrderCreateRequest(product_id=self.monthly.id, month_count=0), "zero-month"),
            (BillingOrderCreateRequest(product_id=self.monthly.id, month_count=37), "too-many-months"),
            (BillingOrderCreateRequest(product_id=self.prepaid.id, month_count=1), "prepaid-month"),
        ):
            with self.subTest(key=key), self.assertRaises(BillingOrderValidationError):
                create_order(self.db, self.user.id, payload, key, now=self.now)

    def test_idempotent_retry_returns_original_snapshot(self):
        payload = BillingOrderCreateRequest(product_id=self.monthly.id, month_count=2)
        first = create_order(self.db, self.user.id, payload, "same-key", now=self.now)
        self.monthly.price = Decimal("399.00")
        self.db.commit()
        second = create_order(self.db, self.user.id, payload, "same-key", now=self.now)
        self.assertEqual(first.id, second.id)
        self.assertEqual(second.unit_price, Decimal("299.00"))
        self.assertEqual(self.db.query(BillingOrder).count(), 1)

    def test_same_idempotency_key_with_different_parameters_conflicts(self):
        create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.monthly.id, month_count=1),
            "same-key",
            now=self.now,
        )
        with self.assertRaises(BillingOrderConflictError):
            create_order(
                self.db,
                self.user.id,
                BillingOrderCreateRequest(product_id=self.monthly.id, month_count=2),
                "same-key",
                now=self.now,
            )

    def test_off_sale_product_cannot_create_order(self):
        self.prepaid.status = "OFF_SALE"
        self.db.commit()
        with self.assertRaises(BillingOrderConflictError):
            create_order(
                self.db,
                self.user.id,
                BillingOrderCreateRequest(product_id=self.prepaid.id),
                "off-sale",
                now=self.now,
            )

    def test_user_cannot_read_or_cancel_another_users_order(self):
        created = create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.prepaid.id),
            "owned",
            now=self.now,
        )
        with self.assertRaises(BillingOrderNotFoundError):
            get_order(self.db, created.id, self.other_user.id)
        with self.assertRaises(BillingOrderNotFoundError):
            cancel_order(self.db, created.id, self.other_user.id)

    def test_cancel_is_idempotent_and_paid_order_cannot_be_canceled(self):
        created = create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.prepaid.id),
            "cancelable",
            now=self.now,
        )
        first = cancel_order(self.db, created.id, self.user.id)
        second = cancel_order(self.db, created.id, self.user.id)
        self.assertEqual(first.status.value, "CANCELED")
        self.assertEqual(first.canceled_at, second.canceled_at)

        paid = create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.prepaid.id),
            "paid",
            now=self.now,
        )
        paid_row = self.db.get(BillingOrder, paid.id)
        paid_row.status = "PAID"
        self.db.commit()
        with self.assertRaises(BillingOrderConflictError):
            cancel_order(self.db, paid.id, self.user.id)

    def test_pending_order_auto_expires_after_thirty_minutes(self):
        from datetime import timedelta
        from app.services.billing_order import expire_stale_pending_orders, get_order

        created = create_order(
            self.db,
            self.user.id,
            BillingOrderCreateRequest(product_id=self.prepaid.id),
            "expire-me",
            now=self.now,
        )
        self.assertEqual(created.status.value, "PENDING_PAYMENT")
        self.assertIsNotNone(created.expires_at)

        row = self.db.get(BillingOrder, created.id)
        row.created_at = (self.now - timedelta(minutes=31)).replace(tzinfo=None)
        self.db.commit()

        expire_stale_pending_orders(self.db, site_user_id=self.user.id)
        refreshed = get_order(self.db, created.id, self.user.id)
        self.assertEqual(refreshed.status.value, "CANCELED")
        self.assertIsNotNone(refreshed.canceled_at)
        self.assertIsNone(refreshed.expires_at)


if __name__ == "__main__":
    unittest.main()
