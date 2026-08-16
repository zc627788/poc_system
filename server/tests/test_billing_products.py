import unittest
from decimal import Decimal

from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models.billing_product import BillingProduct
from app.schemas.billing import BillingProductCreateRequest, BillingProductUpdateRequest
from app.services.billing_product import (
    BillingProductConflictError,
    create_admin_product,
    get_public_products,
    update_admin_product,
    update_admin_product_status,
)
from app.schemas.billing import BillingProductStatus


def product_payload(**overrides):
    values = {
        "product_code": "AI_COMPUTE_1000",
        "service_code": "AI_COMPUTE",
        "service_name": "AI 算力服务",
        "supplier_name": "示例供应商",
        "name": "AI 算力充值 1000 元",
        "description": "用于 AI 算力资源消费",
        "billing_mode": "PREPAID",
        "price": "1000.00",
        "sort_order": 10,
        "status": "ON_SALE",
    }
    values.update(overrides)
    return values


class BillingProductSchemaTests(unittest.TestCase):
    def test_rejects_zero_negative_and_excess_precision_prices(self):
        for price in ("0", "-1", "10.001"):
            with self.subTest(price=price), self.assertRaises(ValidationError):
                BillingProductCreateRequest.model_validate(product_payload(price=price))

    def test_rejects_lowercase_product_code(self):
        with self.assertRaises(ValidationError):
            BillingProductCreateRequest.model_validate(product_payload(product_code="ai_compute"))


class BillingProductServiceTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        BillingProduct.__table__.create(engine)
        self.Session = sessionmaker(bind=engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_public_list_only_returns_on_sale_products_in_sort_order(self):
        first = BillingProductCreateRequest.model_validate(product_payload())
        create_admin_product(self.db, first, 1)
        second = BillingProductCreateRequest.model_validate(
            product_payload(
                product_code="AI_COMPUTE_2000",
                name="AI 算力充值 2000 元",
                price="2000.00",
                sort_order=5,
                status="OFF_SALE",
            )
        )
        hidden = create_admin_product(self.db, second, 1)
        self.assertEqual([item.product_code for item in get_public_products(self.db)], ["AI_COMPUTE_1000"])

        update_admin_product_status(self.db, hidden.id, BillingProductStatus.ON_SALE, 1)
        self.assertEqual(
            [item.product_code for item in get_public_products(self.db)],
            ["AI_COMPUTE_2000", "AI_COMPUTE_1000"],
        )

    def test_duplicate_product_code_is_rejected(self):
        payload = BillingProductCreateRequest.model_validate(product_payload())
        create_admin_product(self.db, payload, 1)
        with self.assertRaises(BillingProductConflictError):
            create_admin_product(self.db, payload, 1)

    def test_service_name_and_supplier_must_remain_consistent(self):
        create_admin_product(self.db, BillingProductCreateRequest.model_validate(product_payload()), 1)
        inconsistent = BillingProductCreateRequest.model_validate(
            product_payload(product_code="AI_COMPUTE_2000", service_name="另一个服务", price="2000.00")
        )
        with self.assertRaises(BillingProductConflictError):
            create_admin_product(self.db, inconsistent, 1)

    def test_product_code_cannot_be_changed(self):
        created = create_admin_product(self.db, BillingProductCreateRequest.model_validate(product_payload()), 1)
        update = BillingProductUpdateRequest.model_validate(
            {**product_payload(product_code="AI_COMPUTE_CHANGED"), "status": "ON_SALE"}
        )
        with self.assertRaises(BillingProductConflictError):
            update_admin_product(self.db, created.id, update, 1)

    def test_decimal_price_is_preserved(self):
        created = create_admin_product(self.db, BillingProductCreateRequest.model_validate(product_payload()), 1)
        self.assertEqual(created.price, Decimal("1000.00"))


if __name__ == "__main__":
    unittest.main()
