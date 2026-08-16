from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from app.api.admin.opc_application_auth import AdminAuthContext, require_admin_auth_context
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.community_join import (
    CommunityJoinApplicationDetailResponse,
    CommunityJoinApplicationListResponse,
    CommunityJoinMaterialFileItem,
    MergeChunksRequest,
)
from app.services.community_join import (
    add_community_join_material,
    delete_community_join_material,
    get_community_join_detail,
    get_community_join_material_for_download,
    list_community_join_summaries,
)
from app.services.opc_upload_storage import UPLOAD_ROOT, resolve_storage_path, storage_path_for_upload
import shutil

router = APIRouter(prefix="/community-join-applications")

COMMUNITY_JOIN_UPLOAD_ROOT = UPLOAD_ROOT / "community-join-materials"
CHUNK_UPLOAD_ROOT = Path("/tmp/chunks")

ALLOWED_EXTENSIONS = {
    "jpg", "jpeg", "png", "gif", "webp", "bmp",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "zip", "rar", "7z",
    "txt",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.get("", response_model=ApiResponse[CommunityJoinApplicationListResponse])
def list_community_join_applications(
    submitter_keyword: str | None = None,
    status_value: str | None = None,
    target_campus: str | None = None,
    start_time: str | None = Query(default=None),
    end_time: str | None = Query(default=None),
    page: int = 1,
    page_size: int = 10,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[CommunityJoinApplicationListResponse]:
    parsed_start = datetime.fromisoformat(start_time) if start_time else None
    parsed_end = datetime.fromisoformat(end_time) if end_time else None
    return ApiResponse(
        data=list_community_join_summaries(
            db,
            submitter_keyword=submitter_keyword,
            status=status_value,
            target_campus=target_campus,
            start_time=parsed_start,
            end_time=parsed_end,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{application_id}", response_model=ApiResponse[CommunityJoinApplicationDetailResponse])
def get_community_join_application(
    application_id: int,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[CommunityJoinApplicationDetailResponse]:
    try:
        return ApiResponse(data=get_community_join_detail(db, application_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{application_id}/materials", response_model=ApiResponse[List[CommunityJoinMaterialFileItem]])
async def upload_community_join_material(
    application_id: int,
    files: List[UploadFile] = File(...),
    admin: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[List[CommunityJoinMaterialFileItem]]:
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请至少选择一个文件")

    results = []
    for file in files:
        original_name = file.filename or "unnamed"
        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型 .{ext}，允许：{', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        contents = await file.read()
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"文件大小超出限制（最大 10 MB），当前 {len(contents) / 1024 / 1024:.1f} MB",
            )

        COMMUNITY_JOIN_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
        unique_name = f"{uuid4().hex}_{original_name}"
        dest: Path = COMMUNITY_JOIN_UPLOAD_ROOT / unique_name
        dest.write_bytes(contents)

        storage_path = storage_path_for_upload(dest)
        file_type = ext or "bin"

        try:
            result = add_community_join_material(
                db,
                application_id=application_id,
                admin_user_id=admin.user_id,
                admin_name=admin.name,
                original_file_name=original_name,
                storage_path=storage_path,
                file_type=file_type,
                file_size=len(contents),
            )
            results.append(result)
        except ValueError as exc:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ApiResponse(data=results)


@router.get("/{application_id}/materials/{file_id}/download")
def download_community_join_material(
    application_id: int,
    file_id: int,
    _: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> FileResponse:
    try:
        file_item = get_community_join_material_for_download(db, application_id, file_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    file_path = resolve_storage_path(file_item.storage_path)
    if file_path is None or not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文件不存在")

    return FileResponse(path=str(file_path), filename=file_item.original_file_name)


@router.delete("/{application_id}/materials/{file_id}", response_model=ApiResponse[bool])
def delete_community_join_material_file(
    application_id: int,
    file_id: int,
    admin: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[bool]:
    try:
        storage_path = delete_community_join_material(db, application_id, file_id, admin.user_id, admin.name)
        file_path = resolve_storage_path(storage_path)
        if file_path and file_path.exists():
            file_path.unlink(missing_ok=True)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data=True)


@router.post("/{application_id}/materials/chunk", response_model=ApiResponse[dict])
async def upload_material_chunk(
    application_id: int,
    chunk: UploadFile = File(...),
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    _: AdminAuthContext = Depends(require_admin_auth_context),
) -> ApiResponse[dict]:
    chunk_dir = CHUNK_UPLOAD_ROOT / upload_id
    chunk_dir.mkdir(parents=True, exist_ok=True)

    contents = await chunk.read()
    chunk_path = chunk_dir / f"chunk_{chunk_index}"
    chunk_path.write_bytes(contents)

    received = sorted([
        int(f.name.split("_")[1])
        for f in chunk_dir.iterdir()
        if f.name.startswith("chunk_")
    ])

    return ApiResponse(data={
        "upload_id": upload_id,
        "chunk_index": chunk_index,
        "received_chunks": received,
        "total_chunks": total_chunks,
        "completed": len(received) == total_chunks,
    })


@router.post("/{application_id}/materials/merge", response_model=ApiResponse[CommunityJoinMaterialFileItem])
async def merge_material_chunks(
    application_id: int,
    payload: MergeChunksRequest,
    admin: AdminAuthContext = Depends(require_admin_auth_context),
    db: Session = Depends(get_db),
) -> ApiResponse[CommunityJoinMaterialFileItem]:
    chunk_dir = CHUNK_UPLOAD_ROOT / payload.upload_id
    if not chunk_dir.exists():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="上传任务不存在")

    received = sorted([
        int(f.name.split("_")[1])
        for f in chunk_dir.iterdir()
        if f.name.startswith("chunk_")
    ])

    if len(received) != payload.total_chunks:
        missing = [i for i in range(payload.total_chunks) if i not in received]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"分片不完整，已接收 {len(received)}/{payload.total_chunks}，缺少: {missing}",
        )

    COMMUNITY_JOIN_UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid4().hex}_{payload.file_name}"
    dest = COMMUNITY_JOIN_UPLOAD_ROOT / unique_name

    with open(dest, "wb") as outfile:
        for i in range(payload.total_chunks):
            chunk_path = chunk_dir / f"chunk_{i}"
            with open(chunk_path, "rb") as infile:
                outfile.write(infile.read())

    shutil.rmtree(chunk_dir)

    file_size = dest.stat().st_size
    if file_size > MAX_FILE_SIZE_BYTES:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超出限制（最大 10 MB），当前 {file_size / 1024 / 1024:.1f} MB",
        )

    ext = payload.file_name.rsplit(".", 1)[-1].lower() if "." in payload.file_name else ""
    if ext not in ALLOWED_EXTENSIONS:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型 .{ext}，允许：{', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    storage_path = storage_path_for_upload(dest)
    file_type = ext or "bin"

    result = add_community_join_material(
        db,
        application_id=application_id,
        admin_user_id=admin.user_id,
        admin_name=admin.name,
        original_file_name=payload.file_name,
        storage_path=storage_path,
        file_type=file_type,
        file_size=file_size,
    )

    return ApiResponse(data=result)
