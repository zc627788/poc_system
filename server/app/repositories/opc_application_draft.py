from sqlalchemy.orm import Session

from app.models.opc_application_draft import OpcApplicationDraft


def get_opc_application_draft_by_site_user(db: Session, site_user_id: int) -> OpcApplicationDraft | None:
    return db.query(OpcApplicationDraft).filter(OpcApplicationDraft.site_user_id == site_user_id).first()


def create_opc_application_draft(db: Session, draft: OpcApplicationDraft) -> OpcApplicationDraft:
    db.add(draft)
    db.flush()
    return draft


def update_opc_application_draft(db: Session, draft: OpcApplicationDraft) -> OpcApplicationDraft:
    db.add(draft)
    db.flush()
    return draft


def delete_opc_application_draft(db: Session, draft: OpcApplicationDraft) -> None:
    db.delete(draft)
    db.flush()
