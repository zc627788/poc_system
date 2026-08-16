from datetime import datetime

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.site_user import SiteUser
from app.models.trusted_dataspace import TrustedDataspaceRegistration, TrustedDataspaceSubmissionAttempt
from app.schemas.trusted_dataspace import (
    AdminTrustedDataspaceRegistrationListResponse,
    AdminTrustedDataspaceRegistrationResponse,
    TrustedDataspaceRegistrationResponse,
    TrustedDataspaceRegistrationSubmitRequest,
    TrustedDataspaceStatus,
)
from app.services.trusted_dataspace_errors import (
    TrustedDataspaceConfigurationError,
    TrustedDataspaceConflictError,
    TrustedDataspaceNotFoundError,
    TrustedDataspaceReadTimeoutError,
    TrustedDataspaceUpstreamError,
    TrustedDataspaceValidationError,
)
from app.services.trusted_dataspace_provider import TrustedDataspaceProvider


RETRYABLE_STATUSES = {TrustedDataspaceStatus.REJECTED.value, TrustedDataspaceStatus.SUBMIT_FAILED.value}
BLOCKING_STATUSES = {
    TrustedDataspaceStatus.SUBMITTING.value,
    TrustedDataspaceStatus.PENDING.value,
    TrustedDataspaceStatus.COMPLETED.value,
    TrustedDataspaceStatus.SUBMISSION_UNKNOWN.value,
}


def validate_mainland_id_card(value: str) -> bool:
    normalized = value.strip().upper()
    if len(normalized) != 18 or not normalized[:17].isdigit() or normalized[-1] not in "0123456789X":
        return False
    weights = (7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2)
    checks = "10X98765432"
    return checks[sum(int(char) * weight for char, weight in zip(normalized[:17], weights)) % 11] == normalized[-1]


def get_registration(db: Session, site_user_id: int) -> TrustedDataspaceRegistrationResponse | None:
    registration = (
        db.query(TrustedDataspaceRegistration)
        .filter(TrustedDataspaceRegistration.site_user_id == site_user_id)
        .first()
    )
    return _to_response(registration) if registration else None


def submit_registration(
    db: Session,
    site_user_id: int,
    idempotency_key: str,
    payload: TrustedDataspaceRegistrationSubmitRequest,
    provider: TrustedDataspaceProvider | None = None,
) -> TrustedDataspaceRegistrationResponse:
    normalized_key = idempotency_key.strip()
    if len(normalized_key) < 8 or len(normalized_key) > 128:
        raise TrustedDataspaceValidationError("Idempotency-Key长度必须为8-128位")
    if not validate_mainland_id_card(payload.legal_person_id_card):
        raise TrustedDataspaceValidationError("法人身份证号码格式或校验位不正确")

    existing_attempt = (
        db.query(TrustedDataspaceSubmissionAttempt)
        .join(TrustedDataspaceRegistration, TrustedDataspaceRegistration.id == TrustedDataspaceSubmissionAttempt.registration_id)
        .filter(
            TrustedDataspaceRegistration.site_user_id == site_user_id,
            TrustedDataspaceSubmissionAttempt.idempotency_key == normalized_key,
        )
        .first()
    )
    if existing_attempt:
        registration = db.query(TrustedDataspaceRegistration).filter_by(id=existing_attempt.registration_id).one()
        return _to_response(registration)

    registration = (
        db.query(TrustedDataspaceRegistration)
        .filter(TrustedDataspaceRegistration.site_user_id == site_user_id)
        .with_for_update()
        .first()
    )
    if registration and registration.status in BLOCKING_STATUSES:
        raise TrustedDataspaceConflictError("当前注册状态不允许重复提交")

    now = datetime.utcnow()
    encrypted_id_card = _fernet().encrypt(payload.legal_person_id_card.encode("utf-8")).decode("ascii")
    if registration is None:
        registration = TrustedDataspaceRegistration(
            site_user_id=site_user_id,
            dept_name=payload.dept_name,
            credit_code=payload.credit_code,
            legal_person_name=payload.legal_person_name,
            legal_person_id_card_ciphertext=encrypted_id_card,
            legal_person_phone=payload.legal_person_phone,
            account=payload.account,
            status=TrustedDataspaceStatus.SUBMITTING.value,
            created_at=now,
            updated_at=now,
        )
        db.add(registration)
    else:
        registration.dept_name = payload.dept_name
        registration.credit_code = payload.credit_code
        registration.legal_person_name = payload.legal_person_name
        registration.legal_person_id_card_ciphertext = encrypted_id_card
        registration.legal_person_phone = payload.legal_person_phone
        registration.account = payload.account
        registration.status = TrustedDataspaceStatus.SUBMITTING.value
        registration.current_seq_no = None
        registration.provider_message = None
        registration.last_error_code = None
        registration.last_error_message = None
        registration.completed_at = None
        registration.updated_at = now
    try:
        db.flush()
        attempt = TrustedDataspaceSubmissionAttempt(
            registration_id=registration.id,
            idempotency_key=normalized_key,
            result_status=TrustedDataspaceStatus.SUBMITTING.value,
            request_started_at=now,
            created_at=now,
        )
        db.add(attempt)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise TrustedDataspaceConflictError("注册请求正在处理中，请勿重复提交") from exc

    active_provider = provider or TrustedDataspaceProvider.from_settings()
    request_payload = {
        "platformType": "OPC",
        "deptName": payload.dept_name,
        "creditCode": payload.credit_code,
        "legalPersonName": payload.legal_person_name,
        "legalPersonIdCard": payload.legal_person_id_card,
        "legalPersonPhone": payload.legal_person_phone,
        "account": payload.account,
    }
    try:
        seq_no = active_provider.submit(request_payload)
    except TrustedDataspaceReadTimeoutError as exc:
        safe_exc = _sanitize_provider_exception(exc, payload)
        _record_submit_failure(db, registration.id, attempt.id, TrustedDataspaceStatus.SUBMISSION_UNKNOWN, safe_exc)
        raise safe_exc from exc
    except (TrustedDataspaceValidationError, TrustedDataspaceUpstreamError) as exc:
        safe_exc = _sanitize_provider_exception(exc, payload)
        _record_submit_failure(db, registration.id, attempt.id, TrustedDataspaceStatus.SUBMIT_FAILED, safe_exc)
        raise safe_exc from exc

    responded_at = datetime.utcnow()
    registration = db.query(TrustedDataspaceRegistration).filter_by(id=registration.id).one()
    attempt = db.query(TrustedDataspaceSubmissionAttempt).filter_by(id=attempt.id).one()
    registration.status = TrustedDataspaceStatus.PENDING.value
    registration.current_seq_no = seq_no
    registration.submitted_at = responded_at
    registration.last_synced_at = responded_at
    registration.last_error_code = None
    registration.last_error_message = None
    registration.updated_at = responded_at
    attempt.seq_no = seq_no
    attempt.result_status = TrustedDataspaceStatus.PENDING.value
    attempt.responded_at = responded_at
    db.commit()
    db.refresh(registration)
    return _to_response(registration)


def sync_registration(
    db: Session,
    site_user_id: int,
    provider: TrustedDataspaceProvider | None = None,
) -> TrustedDataspaceRegistrationResponse:
    registration = (
        db.query(TrustedDataspaceRegistration)
        .filter(TrustedDataspaceRegistration.site_user_id == site_user_id)
        .first()
    )
    if registration is None:
        raise TrustedDataspaceNotFoundError("尚未提交可信数据空间注册")
    return _sync_registration_record(db, registration, provider or TrustedDataspaceProvider.from_settings())


def sync_admin_registration(
    db: Session,
    registration_id: int,
    provider: TrustedDataspaceProvider | None = None,
) -> AdminTrustedDataspaceRegistrationResponse:
    row = (
        db.query(TrustedDataspaceRegistration, SiteUser)
        .join(SiteUser, SiteUser.id == TrustedDataspaceRegistration.site_user_id)
        .filter(TrustedDataspaceRegistration.id == registration_id)
        .first()
    )
    if row is None:
        raise TrustedDataspaceNotFoundError("注册记录不存在")
    registration, user = row
    _sync_registration_record(db, registration, provider or TrustedDataspaceProvider.from_settings())
    return _to_admin_response(registration, user)


def sync_pending_admin_registrations(
    db: Session,
    provider: TrustedDataspaceProvider,
    limit: int = 100,
) -> int:
    registrations = (
        db.query(TrustedDataspaceRegistration)
        .filter(
            TrustedDataspaceRegistration.status == TrustedDataspaceStatus.PENDING.value,
            TrustedDataspaceRegistration.current_seq_no.isnot(None),
        )
        .order_by(TrustedDataspaceRegistration.last_synced_at.asc(), TrustedDataspaceRegistration.id.asc())
        .limit(limit)
        .all()
    )
    for registration in registrations:
        _sync_registration_record(db, registration, provider)
    return len(registrations)


def list_admin_registrations(
    db: Session,
    page: int,
    page_size: int,
    keyword: str | None = None,
    registration_status: str | None = None,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> AdminTrustedDataspaceRegistrationListResponse:
    query = db.query(TrustedDataspaceRegistration, SiteUser).join(
        SiteUser, SiteUser.id == TrustedDataspaceRegistration.site_user_id
    )
    if keyword and keyword.strip():
        like_value = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                TrustedDataspaceRegistration.dept_name.like(like_value),
                TrustedDataspaceRegistration.account.like(like_value),
                TrustedDataspaceRegistration.credit_code.like(like_value),
                SiteUser.name.like(like_value),
                SiteUser.phone.like(like_value),
            )
        )
    if registration_status:
        query = query.filter(TrustedDataspaceRegistration.status == registration_status)
    if start_at:
        query = query.filter(TrustedDataspaceRegistration.updated_at >= start_at)
    if end_at:
        query = query.filter(TrustedDataspaceRegistration.updated_at <= end_at)
    total = query.count()
    rows = (
        query.order_by(TrustedDataspaceRegistration.updated_at.desc(), TrustedDataspaceRegistration.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return AdminTrustedDataspaceRegistrationListResponse(
        items=[_to_admin_response(registration, user) for registration, user in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


def _sync_registration_record(
    db: Session,
    registration: TrustedDataspaceRegistration,
    provider: TrustedDataspaceProvider,
) -> TrustedDataspaceRegistrationResponse:
    if not registration.current_seq_no:
        raise TrustedDataspaceConflictError("当前记录没有可查询的流程序列号")
    provider_status = provider.query(registration.current_seq_no)
    now = datetime.utcnow()
    mapped = {
        0: TrustedDataspaceStatus.PENDING,
        1: TrustedDataspaceStatus.COMPLETED,
        2: TrustedDataspaceStatus.REJECTED,
    }[provider_status]
    registration.status = mapped.value
    registration.last_synced_at = now
    registration.updated_at = now
    registration.last_error_code = None
    registration.last_error_message = None
    if mapped is TrustedDataspaceStatus.COMPLETED and registration.completed_at is None:
        registration.completed_at = now
    db.commit()
    db.refresh(registration)
    return _to_response(registration)


def _record_submit_failure(
    db: Session,
    registration_id: int,
    attempt_id: int,
    failure_status: TrustedDataspaceStatus,
    exc: Exception,
) -> None:
    now = datetime.utcnow()
    registration = db.query(TrustedDataspaceRegistration).filter_by(id=registration_id).one()
    attempt = db.query(TrustedDataspaceSubmissionAttempt).filter_by(id=attempt_id).one()
    message = str(exc)[:500]
    registration.status = failure_status.value
    registration.last_error_code = exc.__class__.__name__[:64]
    registration.last_error_message = message
    registration.updated_at = now
    attempt.result_status = failure_status.value
    attempt.provider_code = exc.__class__.__name__[:64]
    attempt.provider_message = message
    attempt.responded_at = now
    db.commit()


def _sanitize_provider_exception(
    exc: Exception,
    payload: TrustedDataspaceRegistrationSubmitRequest,
) -> Exception:
    message = str(exc)
    replacements = (
        (payload.legal_person_id_card, _mask_id_card(payload.legal_person_id_card)),
        (payload.legal_person_phone, _mask_phone(payload.legal_person_phone)),
        (payload.credit_code, _mask_credit_code(payload.credit_code)),
    )
    for raw_value, masked_value in replacements:
        if raw_value:
            message = message.replace(raw_value, masked_value)
    return exc.__class__(message[:500])


def _fernet() -> Fernet:
    key = settings.trusted_dataspace_data_key.strip()
    if not key:
        raise TrustedDataspaceConfigurationError("可信数据空间敏感数据加密密钥未配置")
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, UnicodeEncodeError) as exc:
        raise TrustedDataspaceConfigurationError("可信数据空间敏感数据加密密钥格式错误") from exc


def _decrypt_id_card(registration: TrustedDataspaceRegistration) -> str:
    try:
        return _fernet().decrypt(registration.legal_person_id_card_ciphertext.encode("ascii")).decode("utf-8")
    except (InvalidToken, UnicodeDecodeError) as exc:
        raise TrustedDataspaceConfigurationError("可信数据空间敏感数据无法解密") from exc


def _to_response(registration: TrustedDataspaceRegistration) -> TrustedDataspaceRegistrationResponse:
    return TrustedDataspaceRegistrationResponse(
        id=registration.id,
        status=TrustedDataspaceStatus(registration.status),
        dept_name=registration.dept_name,
        credit_code=registration.credit_code,
        credit_code_masked=_mask_credit_code(registration.credit_code),
        legal_person_name=registration.legal_person_name,
        legal_person_id_card_masked=_mask_id_card(_decrypt_id_card(registration)),
        legal_person_phone=registration.legal_person_phone,
        legal_person_phone_masked=_mask_phone(registration.legal_person_phone),
        account=registration.account,
        seq_no=registration.current_seq_no,
        provider_message=registration.provider_message,
        last_error_message=registration.last_error_message,
        can_retry=registration.status in RETRYABLE_STATUSES,
        portal_url=settings.trusted_dataspace_portal_url,
        submitted_at=registration.submitted_at,
        completed_at=registration.completed_at,
        last_synced_at=registration.last_synced_at,
        created_at=registration.created_at,
        updated_at=registration.updated_at,
    )


def _to_admin_response(
    registration: TrustedDataspaceRegistration, user: SiteUser
) -> AdminTrustedDataspaceRegistrationResponse:
    base = _to_response(registration).model_dump(exclude={"credit_code", "legal_person_phone"})
    return AdminTrustedDataspaceRegistrationResponse(
        **base,
        site_user_id=user.id,
        site_user_name=user.name,
        site_user_phone_masked=_mask_phone(user.phone),
    )


def _mask_phone(value: str) -> str:
    return f"{value[:3]}****{value[-4:]}" if len(value) >= 7 else "****"


def _mask_id_card(value: str) -> str:
    return f"{value[:6]}********{value[-4:]}" if len(value) == 18 else "********"


def _mask_credit_code(value: str) -> str:
    return f"{value[:6]}********{value[-4:]}" if len(value) == 18 else "********"
