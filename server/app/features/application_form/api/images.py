from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.features.application_form.schemas.submit_request import ApplicationFormImageDeleteRequest
from app.schemas.common import ApiResponse
from app.schemas.opc_application import OpcMaterialUploadItem
from app.services.opc_material_file import (
    create_material_upload_record,
    delete_material_file_from_disk,
    mark_material_deleted_before_submit,
    validate_material_upload,
)
from app.services.opc_upload_storage import UPLOAD_ROOT, storage_path_for_upload

router = APIRouter(prefix="/application-form")
OPC_MATERIAL_UPLOAD_ROOT = UPLOAD_ROOT / "opc-materials"


@router.post("/images", response_model=ApiResponse[OpcMaterialUploadItem])
async def upload_image(
    image_key: str = Form(...),
    file: UploadFile = File(...),
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[OpcMaterialUploadItem]:
    original_name = (file.filename or "uploaded-file").strip()
    target_path: Path | None = None
    try:
        content = await file.read()
        validate_material_upload(image_key, original_name, len(content))
        suffix = Path(original_name).suffix.lower()
        safe_name = f"{uuid4().hex}{suffix}"
        target_dir = OPC_MATERIAL_UPLOAD_ROOT / str(user_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / safe_name
        target_path.write_bytes(content)
        result = create_material_upload_record(
            db,
            user_id,
            material_category=image_key,
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


@router.delete("/images", response_model=ApiResponse[bool])
def delete_image(
    payload: ApplicationFormImageDeleteRequest,
    user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[bool]:
    try:
        storage_path = mark_material_deleted_before_submit(db, user_id, payload.file_id)
        delete_material_file_from_disk(storage_path)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=True)
