import unittest
from datetime import datetime, timedelta
from unittest.mock import Mock

import httpx
from cryptography.fernet import Fernet
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models.site_user import SiteUser
from app.models.trusted_dataspace import TrustedDataspaceRegistration, TrustedDataspaceSubmissionAttempt
from app.schemas.trusted_dataspace import TrustedDataspaceRegistrationSubmitRequest, TrustedDataspaceStatus
from app.services.trusted_dataspace_provider import TrustedDataspaceProvider
from app.services.trusted_dataspace import (
    TrustedDataspaceConflictError,
    TrustedDataspaceReadTimeoutError,
    TrustedDataspaceUpstreamError,
    TrustedDataspaceValidationError,
    get_registration,
    list_admin_registrations,
    submit_registration,
    sync_registration,
    validate_mainland_id_card,
)


VALID_PAYLOAD = TrustedDataspaceRegistrationSubmitRequest(
    dept_name="厦门深蓝科技有限公司",
    credit_code="91350200MA8U12345X",
    legal_person_name="王一",
    legal_person_id_card="11010519491231002X",
    legal_person_phone="13900000001",
    account="xiamen_deepblue",
    privacy_consent=True,
)


class TrustedDataspaceServiceTests(unittest.TestCase):
    def setUp(self):
        from app.core.config import settings

        self.original_data_key = settings.trusted_dataspace_data_key
        settings.trusted_dataspace_data_key = Fernet.generate_key().decode()
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        for table in (
            SiteUser.__table__,
            TrustedDataspaceRegistration.__table__,
            TrustedDataspaceSubmissionAttempt.__table__,
        ):
            table.create(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.user = SiteUser(id=1, phone="13900000001", password_hash="hash", name="测试用户", status=1)
        self.db.add(self.user)
        self.db.commit()

    def tearDown(self):
        from app.core.config import settings

        settings.trusted_dataspace_data_key = self.original_data_key
        self.db.close()
        self.engine.dispose()

    def test_validates_mainland_id_card_checksum(self):
        self.assertTrue(validate_mainland_id_card("11010519491231002X"))
        self.assertFalse(validate_mainland_id_card("110105194912310021"))

    def test_successful_submit_persists_seq_no_and_masks_sensitive_fields(self):
        provider = Mock()
        provider.submit.return_value = "SEQ-20260722-001"

        result = submit_registration(self.db, self.user.id, "idem-001", VALID_PAYLOAD, provider)

        self.assertEqual(TrustedDataspaceStatus.PENDING, result.status)
        self.assertEqual("SEQ-20260722-001", result.seq_no)
        self.assertEqual("110105********002X", result.legal_person_id_card_masked)
        self.assertNotIn("11010519491231002X", repr(result))
        provider.submit.assert_called_once()
        request = provider.submit.call_args.args[0]
        self.assertEqual("OPC", request["platformType"])
        self.assertEqual("厦门深蓝科技有限公司", request["deptName"])
        self.assertEqual("11010519491231002X", request["legalPersonIdCard"])

    def test_same_idempotency_key_returns_existing_result_without_resubmitting(self):
        provider = Mock()
        provider.submit.return_value = "SEQ-001"
        first = submit_registration(self.db, self.user.id, "same-key", VALID_PAYLOAD, provider)
        second = submit_registration(self.db, self.user.id, "same-key", VALID_PAYLOAD, provider)

        self.assertEqual(first.id, second.id)
        self.assertEqual(1, provider.submit.call_count)
        self.assertEqual(1, self.db.query(TrustedDataspaceSubmissionAttempt).count())

    def test_active_registration_rejects_different_idempotency_key(self):
        provider = Mock()
        provider.submit.return_value = "SEQ-001"
        submit_registration(self.db, self.user.id, "first-key", VALID_PAYLOAD, provider)

        with self.assertRaises(TrustedDataspaceConflictError):
            submit_registration(self.db, self.user.id, "second-key", VALID_PAYLOAD, provider)

    def test_read_timeout_blocks_blind_retry(self):
        provider = Mock()
        provider.submit.side_effect = TrustedDataspaceReadTimeoutError("上游响应超时")

        with self.assertRaises(TrustedDataspaceReadTimeoutError):
            submit_registration(self.db, self.user.id, "timeout-key", VALID_PAYLOAD, provider)

        registration = get_registration(self.db, self.user.id)
        self.assertEqual(TrustedDataspaceStatus.SUBMISSION_UNKNOWN, registration.status)
        with self.assertRaises(TrustedDataspaceConflictError):
            submit_registration(self.db, self.user.id, "retry-key", VALID_PAYLOAD, provider)

    def test_provider_error_is_masked_before_storage_and_response(self):
        provider = Mock()
        provider.submit.side_effect = TrustedDataspaceValidationError(
            "资料错误: 11010519491231002X / 13900000001 / 91350200MA8U12345X"
        )

        with self.assertRaises(TrustedDataspaceValidationError) as raised:
            submit_registration(self.db, self.user.id, "masked-error-key", VALID_PAYLOAD, provider)

        error_text = str(raised.exception)
        registration = get_registration(self.db, self.user.id)
        self.assertNotIn("11010519491231002X", error_text)
        self.assertNotIn("13900000001", error_text)
        self.assertNotIn("91350200MA8U12345X", error_text)
        self.assertIn("110105********002X", error_text)
        self.assertEqual(error_text, registration.last_error_message)

    def test_rejected_registration_can_be_resubmitted(self):
        provider = Mock()
        provider.submit.side_effect = ["SEQ-001", "SEQ-002"]
        provider.query.return_value = 2
        submit_registration(self.db, self.user.id, "first-key", VALID_PAYLOAD, provider)
        rejected = sync_registration(self.db, self.user.id, provider)
        self.assertEqual(TrustedDataspaceStatus.REJECTED, rejected.status)

        retried = submit_registration(self.db, self.user.id, "retry-key", VALID_PAYLOAD, provider)
        self.assertEqual("SEQ-002", retried.seq_no)
        self.assertEqual(2, self.db.query(TrustedDataspaceSubmissionAttempt).count())

    def test_sync_maps_provider_status_and_preserves_state_on_provider_error(self):
        provider = Mock()
        provider.submit.return_value = "SEQ-001"
        provider.query.return_value = 1
        submit_registration(self.db, self.user.id, "first-key", VALID_PAYLOAD, provider)

        completed = sync_registration(self.db, self.user.id, provider)
        self.assertEqual(TrustedDataspaceStatus.COMPLETED, completed.status)
        self.assertIsNotNone(completed.completed_at)

        provider.query.side_effect = TrustedDataspaceValidationError("无效的流程序列号")
        with self.assertRaises(TrustedDataspaceValidationError):
            sync_registration(self.db, self.user.id, provider)
        self.assertEqual(TrustedDataspaceStatus.COMPLETED, get_registration(self.db, self.user.id).status)

    def test_admin_list_filters_by_updated_time(self):
        provider = Mock()
        provider.submit.return_value = "SEQ-001"
        submit_registration(self.db, self.user.id, "filter-key", VALID_PAYLOAD, provider)

        future = datetime.utcnow() + timedelta(days=1)
        result = list_admin_registrations(self.db, 1, 20, start_at=future)

        self.assertEqual(0, result.total)


class TrustedDataspaceProviderTests(unittest.TestCase):
    def test_submit_sends_token_and_exact_provider_field_names(self):
        captured = {}

        def handler(request: httpx.Request):
            captured["request"] = request
            return httpx.Response(200, json={"code": 0, "success": True, "message": None, "data": "SEQ-001"})

        provider = TrustedDataspaceProvider(
            base_url="https://dataspace.example/platform",
            token="test-token",
            transport=httpx.MockTransport(handler),
        )
        seq_no = provider.submit(
            {
                "platformType": "OPC",
                "deptName": "厦门深蓝科技有限公司",
                "creditCode": "91350200MA8U12345X",
                "legalPersonName": "王一",
                "legalPersonIdCard": "11010519491231002X",
                "legalPersonPhone": "13900000001",
                "account": "xiamen_deepblue",
            }
        )

        self.assertEqual("SEQ-001", seq_no)
        self.assertEqual("test-token", captured["request"].headers["X-Token"])
        self.assertEqual("/platform/registry.do", captured["request"].url.path)
        self.assertEqual("OPC", __import__("json").loads(captured["request"].content)["platformType"])

    def test_query_maps_response_data_and_rejects_non_json(self):
        responses = iter(
            [
                httpx.Response(200, json={"code": 0, "success": True, "message": None, "data": 1}),
                httpx.Response(200, text="not-json"),
            ]
        )
        provider = TrustedDataspaceProvider(
            base_url="https://dataspace.example/platform",
            token="test-token",
            transport=httpx.MockTransport(lambda _: next(responses)),
        )

        self.assertEqual(1, provider.query("SEQ-001"))
        with self.assertRaises(TrustedDataspaceUpstreamError):
            provider.query("SEQ-001")


if __name__ == "__main__":
    unittest.main()
