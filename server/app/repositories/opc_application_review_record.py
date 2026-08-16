from sqlalchemy.orm import Session

from app.models.opc_application_review_record import OpcApplicationReviewRecord


def create_opc_review_record(db: Session, record: OpcApplicationReviewRecord) -> OpcApplicationReviewRecord:
    db.add(record)
    db.flush()
    return record


def list_opc_review_records_by_application(db: Session, application_id: int) -> list[OpcApplicationReviewRecord]:
    return (
        db.query(OpcApplicationReviewRecord)
        .filter(OpcApplicationReviewRecord.application_id == application_id)
        .order_by(OpcApplicationReviewRecord.operated_at.asc(), OpcApplicationReviewRecord.id.asc())
        .all()
    )
