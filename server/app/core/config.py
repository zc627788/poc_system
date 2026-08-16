from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Business Portal API"
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    jwt_secret_key: str = "local-development-only-change-me"
    jwt_algorithm: str = "HS256"
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "opc_portal"
    site_public_url: str = "http://127.0.0.1:3000"
    test_auth_bridge_enabled: bool = False
    ixiamen_sso_enabled: bool = False
    ixiamen_base_uri: str = ""
    ixiamen_client_id: str = ""
    ixiamen_client_secret: str = ""
    ixiamen_redirect_uri: str = ""
    ixiamen_scope: str = "basic name mobile"
    ixiamen_channel: str = "IXM_PC"
    ixiamen_channel_mobile: str = "IXM"
    ixiamen_post_login_redirect: str = "/"
    ixiamen_logout_redirect_uri: str = ""
    sms_enabled: bool = False
    sms_provider: str = "mock"
    sms_access_key_id: str = ""
    sms_access_key_secret: str = ""
    sms_sign_name: str = "Demo Portal"
    sms_approved_template_code: str = ""
    sms_license_ready_template_code: str = ""
    sms_pickup_address: str = ""
    sms_contact_phone: str = ""
    payment_provider: str = "mock"
    mock_payment_enabled: bool = False
    mock_payment_signing_secret: str = ""
    trusted_dataspace_enabled: bool = False
    trusted_dataspace_base_url: str = ""
    trusted_dataspace_x_token: str = ""
    trusted_dataspace_data_key: str = ""
    trusted_dataspace_portal_url: str = ""
    trusted_dataspace_ca_bundle: str = ""
    trusted_dataspace_connect_timeout_seconds: float = 5.0
    trusted_dataspace_read_timeout_seconds: float = 15.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.mysql_user}:{self.mysql_password}"
            f"@{self.mysql_host}:{self.mysql_port}/{self.mysql_database}?charset=utf8mb4"
        )

    @property
    def normalized_site_public_url(self) -> str:
        return self.site_public_url.rstrip("/")

    @property
    def normalized_ixiamen_base_uri(self) -> str:
        return self.ixiamen_base_uri.rstrip("/")

    @property
    def has_ixiamen_sso_config(self) -> bool:
        return bool(
            self.ixiamen_sso_enabled
            and self.ixiamen_base_uri
            and self.ixiamen_client_id
            and self.ixiamen_client_secret
            and self.ixiamen_redirect_uri
        )

    @property
    def allow_test_auth_bridge(self) -> bool:
        return bool(self.test_auth_bridge_enabled)

    @property
    def payment_provider_normalized(self) -> str:
        return self.payment_provider.strip().upper() or "MOCK"

    @property
    def is_production_environment(self) -> bool:
        return self.app_env.strip().lower() == "production"

    @property
    def is_test_environment(self) -> bool:
        return self.app_env.strip().lower() == "test"


settings = Settings()
