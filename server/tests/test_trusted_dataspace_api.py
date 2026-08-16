import unittest
from unittest.mock import Mock, patch

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.api.public.auth import require_site_user_auth
from app.core.config import settings
from app.core.database import get_db

settings.app_env = "test"
settings.mock_payment_enabled = True
settings.mock_payment_signing_secret = "test-payment-secret"
from app.main import app
from app.models.site_user import SiteUser
from app.models.trusted_dataspace import TrustedDataspaceRegistration, TrustedDataspaceSubmissionAttempt
from app.services.trusted_dataspace_errors import TrustedDataspaceConfigurationError


class TrustedDataspaceApiTests(unittest.TestCase):
    def setUp(self):
        from app.core.config import settings

        self.original_data_key = settings.trusted_dataspace_data_key
        self.original_portal_url = settings.trusted_dataspace_portal_url
        settings.trusted_dataspace_data_key = Fernet.generate_key().decode()
        settings.trusted_dataspace_portal_url = "https://dataspace.example/"

        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        for table in (SiteUser.__table__, TrustedDataspaceRegistration.__table__, TrustedDataspaceSubmissionAttempt.__table__):
            table.create(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        with self.Session() as db:
            db.add(SiteUser(id=1, phone="13900000001", password_hash="hash", name="测试用户", status=1))
            db.commit()

        def override_db():
            db = self.Session()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_db
        self.client = TestClient(app, raise_server_exceptions=False)

    def tearDown(self):
        from app.core.config import settings

        app.dependency_overrides.clear()
        settings.trusted_dataspace_data_key = self.original_data_key
        settings.trusted_dataspace_portal_url = self.original_portal_url
        self.engine.dispose()

    def test_public_registration_endpoint_requires_login(self):
        response = self.client.get("/api/public/trusted-data-space/registration")
        self.assertEqual(401, response.status_code)

    def test_submit_hides_internal_configuration_details(self):
        app.dependency_overrides[require_site_user_auth] = lambda: 1
        payload = {
            "dept_name": "厦门深蓝科技有限公司",
            "credit_code": "91350200MA8U12345X",
            "legal_person_name": "王一",
            "legal_person_id_card": "11010519491231002X",
            "legal_person_phone": "13900000001",
            "account": "xiamen_deepblue",
            "privacy_consent": True,
        }
        with patch(
            "app.api.public.trusted_dataspace.TrustedDataspaceProvider.from_settings",
            side_effect=TrustedDataspaceConfigurationError("可信数据空间服务暂未启用"),
        ):
            response = self.client.post(
                "/api/public/trusted-data-space/registration/submit",
                headers={"Idempotency-Key": "config-error-key"},
                json=payload,
            )

        self.assertEqual(503, response.status_code)
        self.assertEqual("注册服务暂时不可用，请稍后再试", response.json()["detail"])
        self.assertNotIn("未启用", response.text)

    def test_invalid_id_card_is_rejected_before_provider_configuration(self):
        app.dependency_overrides[require_site_user_auth] = lambda: 1
        payload = {
            "dept_name": "厦门深蓝科技有限公司",
            "credit_code": "91350200MA8U12345X",
            "legal_person_name": "王一",
            "legal_person_id_card": "110105194912310021",
            "legal_person_phone": "13900000001",
            "account": "xiamen_deepblue",
            "privacy_consent": True,
        }
        with patch(
            "app.api.public.trusted_dataspace.TrustedDataspaceProvider.from_settings",
            side_effect=AssertionError("无效字段不应调用上游配置"),
        ):
            response = self.client.post(
                "/api/public/trusted-data-space/registration/submit",
                headers={"Idempotency-Key": "invalid-id-key"},
                json=payload,
            )

        self.assertEqual(422, response.status_code)
        self.assertIn("身份证号码校验位不正确", response.text)

    def test_submit_and_get_use_api_response_and_mask_sensitive_data(self):
        app.dependency_overrides[require_site_user_auth] = lambda: 1
        provider = Mock()
        provider.submit.return_value = "SEQ-API-001"
        payload = {
            "dept_name": "厦门深蓝科技有限公司",
            "credit_code": "91350200MA8U12345X",
            "legal_person_name": "王一",
            "legal_person_id_card": "11010519491231002X",
            "legal_person_phone": "13900000001",
            "account": "xiamen_deepblue",
            "privacy_consent": True,
        }
        with patch("app.api.public.trusted_dataspace.TrustedDataspaceProvider.from_settings", return_value=provider):
            response = self.client.post(
                "/api/public/trusted-data-space/registration/submit",
                headers={"Idempotency-Key": "api-key-001"},
                json=payload,
            )

        self.assertEqual(200, response.status_code)
        body = response.json()
        self.assertEqual(0, body["code"])
        self.assertEqual("PENDING", body["data"]["status"])
        self.assertEqual(payload["credit_code"], body["data"]["credit_code"])
        self.assertEqual(payload["legal_person_phone"], body["data"]["legal_person_phone"])
        self.assertNotIn("11010519491231002X", response.text)

        fetched = self.client.get("/api/public/trusted-data-space/registration")
        self.assertEqual("SEQ-API-001", fetched.json()["data"]["seq_no"])

    def test_admin_list_requires_auth_and_returns_masked_rows(self):
        unauthenticated = self.client.get("/api/admin/trusted-data-space/registrations")
        self.assertEqual(401, unauthenticated.status_code)

        app.dependency_overrides[require_site_user_auth] = lambda: 1
        provider = Mock()
        provider.submit.return_value = "SEQ-ADMIN-001"
        payload = {
            "dept_name": "厦门深蓝科技有限公司",
            "credit_code": "91350200MA8U12345X",
            "legal_person_name": "王一",
            "legal_person_id_card": "11010519491231002X",
            "legal_person_phone": "13900000001",
            "account": "xiamen_deepblue",
            "privacy_consent": True,
        }
        with patch("app.api.public.trusted_dataspace.TrustedDataspaceProvider.from_settings", return_value=provider):
            self.client.post(
                "/api/public/trusted-data-space/registration/submit",
                headers={"Idempotency-Key": "admin-key-001"},
                json=payload,
            )

        app.dependency_overrides[require_admin_auth_context] = lambda: AdminAuthContext(
            user_id=1, username="admin", name="管理员", can_delete_materials=True
        )
        response = self.client.get("/api/admin/trusted-data-space/registrations")
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, response.json()["data"]["total"])
        self.assertNotIn("11010519491231002X", response.text)
        self.assertNotIn(payload["credit_code"], response.text)
        self.assertNotIn(payload["legal_person_phone"], response.text)

    def test_admin_list_refreshes_pending_status_from_provider(self):
        app.dependency_overrides[require_site_user_auth] = lambda: 1
        submit_provider = Mock()
        submit_provider.submit.return_value = "SEQ-ADMIN-REFRESH-001"
        payload = {
            "dept_name": "厦门深蓝科技有限公司",
            "credit_code": "91350200MA8U12345X",
            "legal_person_name": "王一",
            "legal_person_id_card": "11010519491231002X",
            "legal_person_phone": "13900000001",
            "account": "xiamen_deepblue",
            "privacy_consent": True,
        }
        with patch("app.api.public.trusted_dataspace.TrustedDataspaceProvider.from_settings", return_value=submit_provider):
            submitted = self.client.post(
                "/api/public/trusted-data-space/registration/submit",
                headers={"Idempotency-Key": "admin-refresh-key"},
                json=payload,
            )
        self.assertEqual(200, submitted.status_code)

        app.dependency_overrides[require_admin_auth_context] = lambda: AdminAuthContext(
            user_id=1, username="admin", name="管理员", can_delete_materials=True
        )
        sync_provider = Mock()
        sync_provider.query.return_value = 2
        with patch("app.api.admin.trusted_dataspace.TrustedDataspaceProvider.from_settings", return_value=sync_provider):
            response = self.client.get("/api/admin/trusted-data-space/registrations")

        self.assertEqual(200, response.status_code)
        self.assertEqual("REJECTED", response.json()["data"]["items"][0]["status"])
        sync_provider.query.assert_called_once_with("SEQ-ADMIN-REFRESH-001")


if __name__ == "__main__":
    unittest.main()
