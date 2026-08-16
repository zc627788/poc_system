from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.opc_application import (
    OpcApplicationDetailResponse,
    OpcApplicationDraftClearResponse,
    OpcApplicationDraftResponse,
    OpcApplicationDraftSaveRequest,
    OpcApplicationDraftSaveResponse,
    OpcApplicationListResponse,
    OpcApplicationMaterialDeleteRequest,
    OpcApplicationSubmitRequest,
    OpcApplicationSubmitResponse,
    OpcMaterialUploadItem,
)
from app.services.opc_application import (
    create_application_submission,
    get_site_user_application_detail,
    list_site_user_applications,
)
from app.services.opc_application_draft import (
    clear_application_draft,
    get_application_draft,
    save_application_draft,
)
from app.services.opc_material_file import (
    create_material_upload_record,
    delete_material_file_from_disk,
    mark_material_deleted_before_submit,
    validate_material_upload,
)
from app.services.opc_upload_storage import UPLOAD_ROOT, storage_path_for_upload


router = APIRouter(prefix="/opc-applications")
OPC_MATERIAL_UPLOAD_ROOT = UPLOAD_ROOT / "opc-materials"


@router.post("", response_model=ApiResponse[OpcApplicationSubmitResponse])
def submit_opc_application(
    payload: OpcApplicationSubmitRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationSubmitResponse]:
    try:
        result = create_application_submission(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)


@router.get("/draft", response_model=ApiResponse[OpcApplicationDraftResponse])
def get_opc_application_draft(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationDraftResponse]:
    return ApiResponse(data=get_application_draft(db, user_id))


@router.post("/draft", response_model=ApiResponse[OpcApplicationDraftSaveResponse])
def save_opc_application_draft(
    payload: OpcApplicationDraftSaveRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationDraftSaveResponse]:
    try:
        result = save_application_draft(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=result)


@router.post("/draft/clear", response_model=ApiResponse[OpcApplicationDraftClearResponse])
def clear_opc_application_draft(
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationDraftClearResponse]:
    return ApiResponse(data=clear_application_draft(db, user_id))


@router.post("/materials", response_model=ApiResponse[OpcMaterialUploadItem])
async def upload_opc_material(
    material_category: str = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcMaterialUploadItem]:
    original_name = (file.filename or "uploaded-file").strip()
    target_path: Path | None = None

    try:
        content = await file.read()
        validate_material_upload(material_category, original_name, len(content))
        suffix = Path(original_name).suffix.lower()
        safe_name = f"{uuid4().hex}{suffix}"
        target_dir = OPC_MATERIAL_UPLOAD_ROOT / str(user_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / safe_name
        target_path.write_bytes(content)
        result = create_material_upload_record(
            db,
            user_id,
            material_category=material_category,
            original_file_name=original_name,
            storage_path=storage_path_for_upload(target_path),
            file_size=len(content),
        )
    except ValueError as exc:
        if target_path is not None and target_path.exists():
            target_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    finally:
        await file.close()

    return ApiResponse(data=result)


@router.delete("/materials", response_model=ApiResponse[bool])
def delete_opc_material_before_submit(
    payload: OpcApplicationMaterialDeleteRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[bool]:
    try:
        storage_path = mark_material_deleted_before_submit(db, user_id, payload.file_id)
        delete_material_file_from_disk(storage_path)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=True)


@router.get("/mine", response_model=ApiResponse[OpcApplicationListResponse])
def get_my_opc_applications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationListResponse]:
    result = list_site_user_applications(db, user_id, page, page_size)
    return ApiResponse(data=result)


@router.get("/mine/{application_id}", response_model=ApiResponse[OpcApplicationDetailResponse])
def get_my_opc_application_detail(
    application_id: int,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcApplicationDetailResponse]:
    try:
        result = get_site_user_application_detail(db, user_id, application_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return ApiResponse(data=result)
