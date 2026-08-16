from datetime import datetime

from sqlalchemy import DateTime, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OpcApplication(Base):
    __tablename__ = "opc_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_no: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    site_user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    source_module: Mapped[str] = mapped_column(String(64), default="opc_application", nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), default="待审核", nullable=False, index=True)
    is_missing_materials: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    latest_status_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_name_alternative_one: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_name_alternative_two: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registered_capital: Mapped[str] = mapped_column(String(64), nullable=False)
    currency: Mapped[str] = mapped_column(String(32), default="人民币", nullable=False)
    business_scope: Mapped[str] = mapped_column(Text, nullable=False)

    shareholder_one_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shareholder_one_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shareholder_one_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shareholder_one_subscribed_capital: Mapped[str | None] = mapped_column(String(64), nullable=True)
    shareholder_one_equity_ratio: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shareholder_one_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shareholder_one_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shareholder_one_valid_until: Mapped[str | None] = mapped_column(String(64), nullable=True)

    shareholder_two_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shareholder_two_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shareholder_two_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    shareholder_two_subscribed_capital: Mapped[str | None] = mapped_column(String(64), nullable=True)
    shareholder_two_equity_ratio: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shareholder_two_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    shareholder_two_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    shareholder_two_valid_until: Mapped[str | None] = mapped_column(String(64), nullable=True)
    shareholders_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    legal_representative_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    legal_representative_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    legal_representative_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    legal_representative_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    manager_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    manager_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    manager_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    manager_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    finance_leader_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    finance_leader_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    finance_leader_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    finance_leader_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supervisor_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    supervisor_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    supervisor_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    supervisor_address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    industrial_contact_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    industrial_contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    industrial_contact_id_no: Mapped[str | None] = mapped_column(String(128), nullable=True)
    industrial_contact_address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    mailing_status: Mapped[str] = mapped_column(String(32), default="待开发", nullable=False)
    form_snapshot_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    premises_source_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    application_form_payload_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
