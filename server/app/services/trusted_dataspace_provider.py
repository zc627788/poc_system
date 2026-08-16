from pathlib import Path
from typing import Any

import httpx

from app.core.config import settings
from app.services.trusted_dataspace_errors import (
    TrustedDataspaceConfigurationError,
    TrustedDataspaceReadTimeoutError,
    TrustedDataspaceUpstreamError,
    TrustedDataspaceValidationError,
)


class TrustedDataspaceProvider:
    def __init__(
        self,
        *,
        base_url: str,
        token: str,
        connect_timeout: float = 5.0,
        read_timeout: float = 15.0,
        verify: bool | str = True,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token.strip()
        self.timeout = httpx.Timeout(connect=connect_timeout, read=read_timeout, write=read_timeout, pool=connect_timeout)
        self.verify = verify
        self.transport = transport

    @classmethod
    def from_settings(cls) -> "TrustedDataspaceProvider":
        if not settings.trusted_dataspace_enabled:
            raise TrustedDataspaceConfigurationError("可信数据空间服务暂未启用")
        if not settings.trusted_dataspace_base_url or not settings.trusted_dataspace_x_token:
            raise TrustedDataspaceConfigurationError("可信数据空间服务配置不完整")
        if not settings.trusted_dataspace_base_url.lower().startswith("https://"):
            raise TrustedDataspaceConfigurationError("可信数据空间服务必须使用HTTPS")
        verify: bool | str = True
        if settings.trusted_dataspace_ca_bundle:
            ca_path = Path(settings.trusted_dataspace_ca_bundle)
            if not ca_path.is_file():
                raise TrustedDataspaceConfigurationError("可信数据空间CA证书文件不存在")
            verify = str(ca_path)
        return cls(
            base_url=settings.trusted_dataspace_base_url,
            token=settings.trusted_dataspace_x_token,
            connect_timeout=settings.trusted_dataspace_connect_timeout_seconds,
            read_timeout=settings.trusted_dataspace_read_timeout_seconds,
            verify=verify,
        )

    def submit(self, payload: dict[str, str]) -> str:
        data = self._request("POST", "/registry.do", json=payload)
        seq_no = str(data or "").strip()
        if not seq_no:
            raise TrustedDataspaceUpstreamError("可信数据空间未返回流程序列号")
        return seq_no

    def query(self, seq_no: str) -> int:
        data = self._request("GET", "/query.do", params={"seqNo": seq_no})
        if isinstance(data, bool) or not isinstance(data, int) or data not in {0, 1, 2}:
            raise TrustedDataspaceUpstreamError("可信数据空间返回了未知注册状态")
        return data

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        try:
            with httpx.Client(
                timeout=self.timeout,
                verify=self.verify,
                transport=self.transport,
                headers={"X-Token": self.token, "Accept": "application/json"},
            ) as client:
                response = client.request(method, f"{self.base_url}{path}", **kwargs)
        except (httpx.ReadTimeout, httpx.WriteTimeout) as exc:
            raise TrustedDataspaceReadTimeoutError("可信数据空间响应超时，提交结果暂不确定") from exc
        except (httpx.ConnectError, httpx.ConnectTimeout) as exc:
            raise TrustedDataspaceUpstreamError("暂时无法连接可信数据空间") from exc
        except httpx.HTTPError as exc:
            raise TrustedDataspaceUpstreamError("可信数据空间请求失败") from exc

        if response.status_code < 200 or response.status_code >= 300:
            raise TrustedDataspaceUpstreamError(f"可信数据空间返回HTTP {response.status_code}")
        try:
            body = response.json()
        except ValueError as exc:
            raise TrustedDataspaceUpstreamError("可信数据空间返回格式异常") from exc
        if not isinstance(body, dict):
            raise TrustedDataspaceUpstreamError("可信数据空间返回格式异常")
        if body.get("code") != 0 or body.get("success") is not True:
            message = str(body.get("message") or "可信数据空间业务处理失败").strip()
            raise TrustedDataspaceValidationError(message[:500])
        return body.get("data")
