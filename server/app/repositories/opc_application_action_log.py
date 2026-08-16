from sqlalchemy.orm import Session

from app.models.opc_application_action_log import OpcApplicationActionLog


def create_opc_action_log(db: Session, action_log: OpcApplicationActionLog) -> OpcApplicationActionLog:
    db.add(action_log)
    db.flush()
    return action_log


def list_opc_action_logs_by_application(db: Session, application_id: int) -> list[OpcApplicationActionLog]:
    return (
        db.query(OpcApplicationActionLog)
        .filter(OpcApplicationActionLog.application_id == application_id)
        .order_by(OpcApplicationActionLog.operated_at.asc(), OpcApplicationActionLog.id.asc())
        .all()
    )
