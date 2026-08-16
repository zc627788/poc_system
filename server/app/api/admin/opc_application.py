from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.models.opc_application_action_log import OpcApplicationActionLog
from app.repositories.opc_application_action_log import create_opc_action_log
from app.repositories.opc_application_material_file import get_opc_material_file_by_id
from app.schemas.common import ApiResponse
from app.schemas.opc_application import (
    OpcApplicationDetailResponse,
    OpcApplicationExportRequest,
    OpcApplicationListResponse,
    OpcApplicationMissingMaterialsRequest,
    OpcApplicationReviewRequest,
)
from app.services.opc_application import get_application_detail, list_admin_application_summaries, review_application, update_missing_materials_flag
from app.services.opc_export import build_export_workbook
from app.services.opc_material_file import delete_material_file_from_disk, mark_material_deleted_by_admin, record_material_download
from app.services.opc_upload_storage import resolve_storage_path


router = APIRouter(prefix="/opc-applications")


@router.get("", response_model=ApiResponse[OpcApplicationListResponse])
def list_admin_opc_applications(
    submitter_keyword: str | None = None,
    status_value: str | None = None,
    start_time: str | None = Query(default=None),
    end_time: str | None = Query(default=None),
    page: int = 1,
    page_size: int = 10,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationListResponse]:
    parsed_start = datetime.fromisoformat(start_time) if start_time else None
    parsed_end = datetime.fromisoformat(end_time) if end_time else None
    return ApiResponse(
        data=list_admin_application_summaries(
            db,
            submitter_keyword=submitter_keyword,
            status=status_value,
            start_time=parsed_start,
            end_time=parsed_end,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{application_id}", response_model=ApiResponse[OpcApplicationDetailResponse])
def get_admin_opc_application_detail(
    application_id: int,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationDetailResponse]:
    try:
        return ApiResponse(data=get_application_detail(db, application_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{application_id}/approve", response_model=ApiResponse[OpcApplicationDetailResponse])
def approve_opc_application(application_id: int, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> ApiResponse[OpcApplicationDetailResponse]:
    try:
        return ApiResponse(data=review_application(db, application_id, admin.user_id, admin.name, OpcApplicationReviewRequest(status="审核通过")))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{application_id}/reject", response_model=ApiResponse[OpcApplicationDetailResponse])
def reject_opc_application(application_id: int, payload: OpcApplicationReviewRequest, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> ApiResponse[OpcApplicationDetailResponse]:
    payload.status = "审核不通过"
    try:
        return ApiResponse(data=review_application(db, application_id, admin.user_id, admin.name, payload))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{application_id}/complete", response_model=ApiResponse[OpcApplicationDetailResponse])
def complete_opc_application(application_id: int, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> ApiResponse[OpcApplicationDetailResponse]:
    try:
        return ApiResponse(data=review_application(db, application_id, admin.user_id, admin.name, OpcApplicationReviewRequest(status="办理完成")))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.put("/{application_id}/missing-materials", response_model=ApiResponse[OpcApplicationDetailResponse])
def update_opc_missing_materials(application_id: int, payload: OpcApplicationMissingMaterialsRequest, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> ApiResponse[OpcApplicationDetailResponse]:
    try:
        return ApiResponse(data=update_missing_materials_flag(db, application_id, admin.user_id, admin.name, payload))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{application_id}/materials/{file_id}/download")
def download_opc_material(application_id: int, file_id: int, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> FileResponse:
    file_item = get_opc_material_file_by_id(db, file_id)
    if file_item is None or file_item.application_id != application_id or file_item.is_deleted == 1:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="material file not found")
    file_path = resolve_storage_path(file_item.storage_path)
    if file_path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="material file missing on disk")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="material file missing on disk")
    try:
        record_material_download(db, application_id, admin.user_id, admin.name, file_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return FileResponse(path=str(file_path), filename=file_item.original_file_name)


@router.delete("/{application_id}/materials/{file_id}", response_model=ApiResponse[bool])
def delete_opc_material_by_admin(application_id: int, file_id: int, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> ApiResponse[bool]:
    if not admin.can_delete_materials:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="only admin can delete material files")

    file_item = get_opc_material_file_by_id(db, file_id)
    if file_item is None or file_item.application_id != application_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="material file not found")
    try:
        storage_path = mark_material_deleted_by_admin(db, application_id, admin.user_id, admin.name, file_id)
        delete_material_file_from_disk(storage_path)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=True)


@router.post("/export")
def export_opc_applications(payload: OpcApplicationExportRequest, admin: AdminAuthContext = Depends(require_admin_auth_context), db: Session = Depends(get_db)) -> Response:
    file_bytes, application_nos = build_export_workbook(db, payload.application_ids)
    for application_no in application_nos:
        create_opc_action_log(db, OpcApplicationActionLog(application_id=0, action_type="application_export", action_target="application", action_summary="后台导出申请记录", action_detail=application_no, operated_by_admin_user_id=admin.user_id, operated_by_name=admin.name))
    db.commit()

    filename = f"opc-applications-{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    encoded_filename = quote(filename)
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
    }
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers,
    )
