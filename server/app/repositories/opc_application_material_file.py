from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.models.opc_application_material_file import OpcApplicationMaterialFile


def create_opc_material_file(db: Session, material_file: OpcApplicationMaterialFile) -> OpcApplicationMaterialFile:
    db.add(material_file)
    db.flush()
    return material_file


def get_opc_material_file_by_id(db: Session, file_id: int) -> OpcApplicationMaterialFile | None:
    return db.query(OpcApplicationMaterialFile).filter(OpcApplicationMaterialFile.id == file_id).first()


def list_opc_material_files_by_application(db: Session, application_id: int) -> list[OpcApplicationMaterialFile]:
    return (
        db.query(OpcApplicationMaterialFile)
        .filter(OpcApplicationMaterialFile.application_id == application_id)
        .order_by(OpcApplicationMaterialFile.uploaded_at.asc(), OpcApplicationMaterialFile.id.asc())
        .all()
    )


def list_opc_active_material_files_by_application(db: Session, application_id: int) -> list[OpcApplicationMaterialFile]:
    return (
        db.query(OpcApplicationMaterialFile)
        .filter(
            OpcApplicationMaterialFile.application_id == application_id,
            OpcApplicationMaterialFile.is_deleted == 0,
        )
        .order_by(OpcApplicationMaterialFile.uploaded_at.asc(), OpcApplicationMaterialFile.id.asc())
        .all()
    )


def list_opc_material_files_by_ids(db: Session, file_ids: Sequence[int]) -> list[OpcApplicationMaterialFile]:
    if not file_ids:
        return []
    return db.query(OpcApplicationMaterialFile).filter(OpcApplicationMaterialFile.id.in_(file_ids)).all()


def list_opc_pending_material_files_by_site_user(db: Session, site_user_id: int) -> list[OpcApplicationMaterialFile]:
    return (
        db.query(OpcApplicationMaterialFile)
        .filter(
            OpcApplicationMaterialFile.site_user_id == site_user_id,
            OpcApplicationMaterialFile.application_id.is_(None),
            OpcApplicationMaterialFile.is_deleted == 0,
        )
        .order_by(OpcApplicationMaterialFile.uploaded_at.asc(), OpcApplicationMaterialFile.id.asc())
        .all()
    )


def list_opc_active_material_files_by_site_user(db: Session, site_user_id: int) -> list[OpcApplicationMaterialFile]:
    return (
        db.query(OpcApplicationMaterialFile)
        .filter(
            OpcApplicationMaterialFile.site_user_id == site_user_id,
            OpcApplicationMaterialFile.is_deleted == 0,
        )
        .order_by(OpcApplicationMaterialFile.uploaded_at.asc(), OpcApplicationMaterialFile.id.asc())
        .all()
    )


def update_opc_material_file(db: Session, material_file: OpcApplicationMaterialFile) -> OpcApplicationMaterialFile:
    db.add(material_file)
    db.flush()
    return material_file
