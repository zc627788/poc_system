import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from io import BytesIO
from unittest.mock import patch

from openpyxl import Workbook
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.billing_order import BillingOrder
from app.models.billing_product import BillingProduct
from app.models.consumption_import import ConsumptionImportBatch, ConsumptionImportRow
from app.models.consumption_record import ConsumptionRecord
from app.models.prepaid_ledger_entry import PrepaidLedgerEntry
from app.models.site_user import SiteUser
from app.models.wallet_ledger_entry import WalletLedgerEntry
from app.schemas.prepaid_billing import ConsumptionImportRowStatus
from app.services.prepaid_billing import (
    EXCEL_HEADERS,
    PrepaidBillingConflictError,
    PrepaidBillingValidationError,
    backfill_paid_prepaid_orders,
    confirm_consumption_import,
    ensure_prepaid_order_credit_entry,
    get_admin_balance_summaries,
    get_admin_consumption_records,
    get_consumption_import_batch_detail,
    get_public_balance_summaries,
    get_public_consumption_records,
    preview_consumption_import,
    _import_consumption_row,
)
from app.services.wallet import get_wallet_summary


UTC = timezone.utc


class PrepaidBillingServiceTests(unittest.TestCase):
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
            ConsumptionImportBatch.__table__,
            ConsumptionImportRow.__table__,
            ConsumptionRecord.__table__,
            PrepaidLedgerEntry.__table__,
            WalletLedgerEntry.__table__,
        ):
            table.create(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.user_one = self._create_user(1, "13900000001", "用户一")
        self.user_two = self._create_user(2, "13900000002", "用户二")
        self.compute_1000 = self._create_product(1, "AI_COMPUTE_1000", "AI_COMPUTE", "AI 算力服务", Decimal("1000.00"))
        self.compute_2000 = self._create_product(2, "AI_COMPUTE_2000", "AI_COMPUTE", "AI 算力服务", Decimal("2000.00"))
        self.storage_500 = self._create_product(3, "AI_STORAGE_500", "AI_STORAGE", "AI 存储服务", Decimal("500.00"))

    def tearDown(self):
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

    def _create_product(self, product_id: int, code: str, service_code: str, service_name: str, price: Decimal) -> BillingProduct:
        item = BillingProduct(
            id=product_id,
            product_code=code,
            service_code=service_code,
            service_name=service_name,
            supplier_name="创新算力服务商" if service_code == "AI_COMPUTE" else "创新存储服务商",
            name=f"商品 {code}",
            billing_mode="PREPAID",
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

    def _create_paid_order(
        self,
        order_id: int,
        user_id: int,
        product: BillingProduct,
        order_no: str,
        amount: Decimal | None = None,
    ) -> BillingOrder:
        item = BillingOrder(
            id=order_id,
            order_no=order_no,
            site_user_id=user_id,
            request_id=f"req-{order_id}",
            product_id=product.id,
            product_code=product.product_code,
            product_name=product.name,
            service_code=product.service_code,
            service_name=product.service_name,
            supplier_name=product.supplier_name,
            billing_mode="PREPAID",
            unit_price=product.price,
            month_count=None,
            order_amount=amount or product.price,
            currency="CNY",
            service_start_date=None,
            service_end_date=None,
            status="PAID",
            paid_at=datetime(2026, 7, 14, 8, 0, 0),
            created_at=datetime(2026, 7, 14, 8, 0, 0),
            updated_at=datetime(2026, 7, 14, 8, 0, 0),
        )
        self.db.add(item)
        self.db.commit()
        return item

    def _build_workbook_bytes(self, data_rows: list[list[str | None]]) -> bytes:
        workbook = Workbook()
        worksheet = workbook.active
        worksheet.title = "消费导入模板"
        worksheet.append(EXCEL_HEADERS)
        for row in data_rows:
            worksheet.append(row)
        output = BytesIO()
        workbook.save(output)
        return output.getvalue()

    def test_prepaid_credit_entries_and_backfill_are_idempotent(self):
        order = self._create_paid_order(1, self.user_one.id, self.compute_1000, "OPC-PREPAID-1")
        self.assertTrue(ensure_prepaid_order_credit_entry(self.db, order, order.paid_at.replace(tzinfo=UTC)))
        self.assertFalse(ensure_prepaid_order_credit_entry(self.db, order, order.paid_at.replace(tzinfo=UTC)))
        self.db.commit()
        self.assertEqual(self.db.query(PrepaidLedgerEntry).count(), 1)

        result_one = backfill_paid_prepaid_orders(self.db)
        result_two = backfill_paid_prepaid_orders(self.db)
        self.assertEqual(result_one.inserted_entries, 0)
        self.assertEqual(result_two.inserted_entries, 0)
        self.assertEqual(self.db.query(PrepaidLedgerEntry).count(), 1)

    def test_same_service_multiple_recharges_aggregate_and_isolate_by_user_and_service(self):
        order_one = self._create_paid_order(1, self.user_one.id, self.compute_1000, "OPC-AI-1000")
        order_two = self._create_paid_order(2, self.user_one.id, self.compute_2000, "OPC-AI-2000")
        order_three = self._create_paid_order(3, self.user_one.id, self.storage_500, "OPC-STORAGE-500")
        order_four = self._create_paid_order(4, self.user_two.id, self.compute_1000, "OPC-AI-USER2")
        for order in (order_one, order_two, order_three, order_four):
            ensure_prepaid_order_credit_entry(self.db, order, order.paid_at.replace(tzinfo=UTC))
        self.db.commit()

        balances_user_one = get_public_balance_summaries(self.db, self.user_one.id)
        self.assertEqual(len(balances_user_one), 2)
        compute_balance = next(item for item in balances_user_one if item.service_code == "AI_COMPUTE")
        storage_balance = next(item for item in balances_user_one if item.service_code == "AI_STORAGE")
        self.assertEqual(compute_balance.total_recharged, Decimal("3000.00"))
        self.assertEqual(storage_balance.total_recharged, Decimal("500.00"))

        balances_user_two = get_public_balance_summaries(self.db, self.user_two.id)
        self.assertEqual(len(balances_user_two), 1)
        self.assertEqual(balances_user_two[0].total_recharged, Decimal("1000.00"))

    def test_preview_confirm_duplicate_file_and_negative_balance_queries(self):
        compute_order = self._create_paid_order(1, self.user_one.id, self.compute_1000, "OPC-AI-PAID-1")
        other_user_order = self._create_paid_order(2, self.user_two.id, self.compute_1000, "OPC-AI-USER2-PAID")
        ensure_prepaid_order_credit_entry(self.db, compute_order, compute_order.paid_at.replace(tzinfo=UTC))
        self.db.commit()

        preview = preview_consumption_import(
            self.db,
            admin_user_id=1,
            file_name="consumptions.xlsx",
            file_bytes=self._build_workbook_bytes(
                [
                    ["SUP-001", "2026-07-14 10:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "GPU 推理", "1.5", "次", "1200.00", "OPC-AI-PAID-1", "超额消费"],
                    ["SUP-002", "2026-07-14 11:00:00", "13900009999", "AI_COMPUTE", "创新算力服务商", "未知用户", "1", "次", "88.00", "", ""],
                    ["SUP-003", "2026-07-14 12:00:00", "13900000001", "UNKNOWN", "创新算力服务商", "未知服务", "1", "次", "88.00", "", ""],
                    ["SUP-001", "2026-07-14 13:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "重复流水", "1", "次", "99.00", "", ""],
                    ["SUP-004", "2026-07-14 14:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "错误订单归属", "1", "次", "66.00", "OPC-AI-USER2-PAID", ""],
                    ["SUP-005", "2026-07-14 15:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "错误金额", "1", "次", "-1.00", "", ""],
                ]
            ),
        )
        self.assertEqual(preview.batch.total_rows, 6)
        self.assertEqual(preview.batch.valid_rows, 1)
        self.assertEqual(preview.batch.invalid_rows, 5)

        confirm = confirm_consumption_import(self.db, preview.batch.id, admin_user_id=1)
        self.assertEqual(confirm.imported_rows, 1)
        confirm_repeat = confirm_consumption_import(self.db, preview.batch.id, admin_user_id=1)
        self.assertEqual(confirm_repeat.imported_rows, 1)
        self.assertEqual(self.db.query(ConsumptionRecord).count(), 1)
        self.assertEqual(
            self.db.query(PrepaidLedgerEntry).filter(PrepaidLedgerEntry.source_type == "CONSUMPTION").count(),
            1,
        )
        # Supplier consumption debits prepaid service credit only, not cash wallet
        self.assertEqual(
            self.db.query(WalletLedgerEntry).filter(WalletLedgerEntry.source_type == "CONSUMPTION").count(),
            0,
        )

        balances = get_public_balance_summaries(self.db, self.user_one.id)
        compute_balance = next(item for item in balances if item.service_code == "AI_COMPUTE")
        self.assertEqual(compute_balance.total_recharged, Decimal("1000.00"))
        self.assertEqual(compute_balance.total_consumed, Decimal("1200.00"))
        self.assertEqual(compute_balance.remaining_balance, Decimal("-200.00"))
        self.assertTrue(compute_balance.insufficient)
        wallet_summary = get_wallet_summary(self.db, self.user_one.id)
        self.assertEqual(wallet_summary.current_balance, Decimal("0.00"))
        self.assertEqual(wallet_summary.total_recharged, Decimal("0.00"))
        self.assertEqual(wallet_summary.total_consumed, Decimal("0.00"))

        admin_balances = get_admin_balance_summaries(self.db, 1, 20, insufficient=True)
        self.assertEqual(admin_balances.total, 1)
        self.assertEqual(admin_balances.items[0].site_user_id, self.user_one.id)

        consumptions_user_one = get_public_consumption_records(self.db, self.user_one.id, 1, 20, service_code="AI_COMPUTE")
        self.assertEqual(consumptions_user_one.total, 1)
        self.assertEqual(consumptions_user_one.summary.total_amount, Decimal("1200.00"))
        self.assertEqual(consumptions_user_one.items[0].order_no, "OPC-AI-PAID-1")

        consumptions_admin = get_admin_consumption_records(self.db, 1, 20, user_keyword="用户一")
        self.assertEqual(consumptions_admin.total, 1)
        self.assertEqual(consumptions_admin.items[0].user_name, "用户一")

        duplicate_preview = preview_consumption_import(
            self.db,
            admin_user_id=1,
            file_name="consumptions-duplicate.xlsx",
            file_bytes=self._build_workbook_bytes(
                [["SUP-001", "2026-07-14 10:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "GPU 推理", "1.5", "次", "1200.00", "OPC-AI-PAID-1", "重复文件"]]
            ),
        )
        self.assertEqual(duplicate_preview.batch.valid_rows, 0)
        self.assertEqual(duplicate_preview.batch.invalid_rows, 1)
        self.assertIn("已导入", duplicate_preview.items[0].error_message or "")

    def test_expired_batch_large_file_and_invalid_header_are_rejected(self):
        with self.assertRaises(PrepaidBillingValidationError):
            preview_consumption_import(self.db, 1, "oversize.xlsx", b"x" * (10 * 1024 * 1024 + 1))

        workbook = Workbook()
        worksheet = workbook.active
        worksheet.append(["错误表头"])
        output = BytesIO()
        workbook.save(output)
        with self.assertRaises(PrepaidBillingValidationError):
            preview_consumption_import(self.db, 1, "bad-header.xlsx", output.getvalue())

        preview = preview_consumption_import(
            self.db,
            admin_user_id=1,
            file_name="will-expire.xlsx",
            file_bytes=self._build_workbook_bytes(
                [["SUP-010", "2026-07-14 10:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "GPU 推理", "1", "次", "88.00", "", ""]]
            ),
        )
        batch = self.db.get(ConsumptionImportBatch, preview.batch.id)
        batch.expires_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1)
        self.db.commit()
        with self.assertRaises(PrepaidBillingConflictError):
            confirm_consumption_import(self.db, batch.id, admin_user_id=1)
        detail = get_consumption_import_batch_detail(self.db, batch.id, None, 1, 100)
        self.assertEqual(detail.batch.status.value, "EXPIRED")
        self.assertEqual(detail.total, 1)

    def test_duplicate_credit_and_consumption_inserts_are_idempotent_under_integrity_error(self):
        order = self._create_paid_order(1, self.user_one.id, self.compute_1000, "OPC-IDEMPOTENT")
        ensure_prepaid_order_credit_entry(self.db, order, order.paid_at.replace(tzinfo=UTC))
        self.db.commit()

        with patch("app.services.prepaid_billing.get_prepaid_ledger_entry_by_source", return_value=None):
            self.assertFalse(ensure_prepaid_order_credit_entry(self.db, order, order.paid_at.replace(tzinfo=UTC)))
        self.db.commit()
        self.assertEqual(self.db.query(PrepaidLedgerEntry).filter(PrepaidLedgerEntry.source_type == "PAID_ORDER").count(), 1)

        preview = preview_consumption_import(
            self.db,
            admin_user_id=1,
            file_name="idempotent.xlsx",
            file_bytes=self._build_workbook_bytes(
                [["SUP-IDEMPOTENT", "2026-07-14 10:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "GPU 推理", "1", "次", "100.00", "OPC-IDEMPOTENT", ""]]
            ),
        )
        row = self.db.query(ConsumptionImportRow).filter(ConsumptionImportRow.batch_id == preview.batch.id).one()
        existing = ConsumptionRecord(
            batch_id=preview.batch.id,
            import_row_id=999,
            record_source=row.record_source,
            supplier_name=row.supplier_name or "",
            supplier_record_no=row.supplier_record_no or "",
            site_user_id=self.user_one.id,
            service_code=row.service_code or "",
            service_name=row.service_name or "",
            order_id=row.order_id,
            consumed_at=row.consumed_at or datetime(2026, 7, 14, 2, 0, 0),
            item_name="已存在消费",
            quantity=Decimal("1.000000"),
            unit="次",
            amount=Decimal("100.00"),
            currency="CNY",
            remark="",
            created_at=datetime(2026, 7, 14, 2, 0, 0),
        )
        self.db.add(existing)
        self.db.commit()

        with patch("app.services.prepaid_billing.get_consumption_record_by_unique_key", return_value=None):
            self.assertFalse(_import_consumption_row(self.db, row))
        self.db.commit()
        refreshed_row = self.db.get(ConsumptionImportRow, row.id)
        self.assertEqual(refreshed_row.row_status, ConsumptionImportRowStatus.INVALID.value)
        self.assertIn("已导入", refreshed_row.error_message or "")
        self.assertEqual(self.db.query(ConsumptionRecord).filter(ConsumptionRecord.supplier_record_no == "SUP-IDEMPOTENT").count(), 1)

    def test_public_and_admin_queries_are_isolated(self):
        order_user_one = self._create_paid_order(1, self.user_one.id, self.compute_1000, "OPC-U1")
        order_user_two = self._create_paid_order(2, self.user_two.id, self.compute_1000, "OPC-U2")
        ensure_prepaid_order_credit_entry(self.db, order_user_one, order_user_one.paid_at.replace(tzinfo=UTC))
        ensure_prepaid_order_credit_entry(self.db, order_user_two, order_user_two.paid_at.replace(tzinfo=UTC))
        self.db.commit()

        preview = preview_consumption_import(
            self.db,
            admin_user_id=1,
            file_name="isolated.xlsx",
            file_bytes=self._build_workbook_bytes(
                [
                    ["SUP-U1", "2026-07-14 10:00:00", "13900000001", "AI_COMPUTE", "创新算力服务商", "用户一消费", "1", "次", "100.00", "OPC-U1", ""],
                    ["SUP-U2", "2026-07-14 11:00:00", "13900000002", "AI_COMPUTE", "创新算力服务商", "用户二消费", "1", "次", "200.00", "OPC-U2", ""],
                ]
            ),
        )
        confirm_consumption_import(self.db, preview.batch.id, admin_user_id=1)

        user_one_consumptions = get_public_consumption_records(self.db, self.user_one.id, 1, 20)
        user_two_consumptions = get_public_consumption_records(self.db, self.user_two.id, 1, 20)
        self.assertEqual(user_one_consumptions.total, 1)
        self.assertEqual(user_two_consumptions.total, 1)
        self.assertEqual(user_one_consumptions.items[0].amount, Decimal("100.00"))
        self.assertEqual(user_two_consumptions.items[0].amount, Decimal("200.00"))

        batch_rows = self.db.query(ConsumptionImportRow).filter(ConsumptionImportRow.batch_id == preview.batch.id).all()
        self.assertTrue(all(row.row_status == ConsumptionImportRowStatus.IMPORTED.value for row in batch_rows))


if __name__ == "__main__":
    unittest.main()
