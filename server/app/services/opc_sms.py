from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from app.core.config import settings
from app.models.opc_application import OpcApplication

logger = logging.getLogger(__name__)

APPROVED_SMS_TEMPLATE = (
    "【厦门OPC社区】尊敬的用户：您提交的OPC企业开办资料已完成审核，状态为“通过”。"
    "请登录 opc.xmsoft.com → 创业服务 → OPC工商注册 查看详情并继续办理后续业务。"
    "如有疑问，请致电罗子明{contact_phone}。感谢您的使用！"
)

LICENSE_READY_SMS_TEMPLATE = (
    "【厦门OPC社区】尊敬的用户：您申请的营业执照已完成工商注册，请您携带本人身份证原件，"
    "前往【{pickup_address}】领取营业执照。如需邮寄，请致电罗子明{contact_phone}。感谢您的使用！"
)


@dataclass(slots=True)
class SmsSendResult:
    success: bool
    message: str
    provider: str
    content: str


@dataclass(slots=True)
class MailingContactInfo:
    has_mailing_info: bool
    summary: str | None = None


class OpcSmsService:
    def send_status_sms(self, *, phone: str | None, status: str) -> SmsSendResult:
        content = self.build_status_sms_content(status=status)
        provider = settings.sms_provider or "mock"

        if not phone:
            return SmsSendResult(success=False, message="申请人手机号为空，未发送短信", provider=provider, content=content)

        if not settings.sms_enabled:
            return SmsSendResult(success=False, message="短信功能未启用，已跳过发送", provider=provider, content=content)

        if provider == "mock":
            logger.info("Mock SMS sent to %s: %s", phone, content)
            return SmsSendResult(success=True, message=f"已通过 mock 渠道发送短信到 {phone}", provider=provider, content=content)

        return SmsSendResult(success=False, message=f"暂未实现短信渠道：{provider}", provider=provider, content=content)

    def build_status_sms_content(self, *, status: str) -> str:
        if status == "审核通过":
            return APPROVED_SMS_TEMPLATE.format(contact_phone=settings.sms_contact_phone)
        if status == "办理完成":
            return LICENSE_READY_SMS_TEMPLATE.format(
                pickup_address=settings.sms_pickup_address,
                contact_phone=settings.sms_contact_phone,
            )
        raise ValueError("当前状态无需发送短信通知")


sms_service = OpcSmsService()


def parse_mailing_contact_info(snapshot_json: str | None, mailing_status: str) -> MailingContactInfo:
    if not snapshot_json:
        return MailingContactInfo(has_mailing_info=False)

    try:
        snapshot = json.loads(snapshot_json)
    except json.JSONDecodeError:
        return MailingContactInfo(has_mailing_info=False)

    if not isinstance(snapshot, dict):
        return MailingContactInfo(has_mailing_info=False)

    values = [
        snapshot.get("mailRecipientName"),
        snapshot.get("mailRecipientPhone"),
        snapshot.get("mailRecipientAddress"),
        snapshot.get("mailingContactName"),
        snapshot.get("mailingContactPhone"),
        snapshot.get("mailingAddress"),
    ]
    normalized = [str(value).strip() for value in values if value and str(value).strip()]
    if not normalized:
        if mailing_status == "待开发":
            return MailingContactInfo(has_mailing_info=False, summary="邮寄能力待开发，暂未收集收件信息")
        return MailingContactInfo(has_mailing_info=False)
    return MailingContactInfo(has_mailing_info=True, summary=" / ".join(normalized))
