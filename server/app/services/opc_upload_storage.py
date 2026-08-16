from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_ROOT = APP_ROOT / "uploads"


def storage_path_for_upload(file_path: Path) -> str:
    return str(file_path.relative_to(APP_ROOT)).replace("\\", "/")


def resolve_storage_path(storage_path: str | None) -> Path | None:
    if not storage_path:
        return None
    file_path = Path(storage_path)
    if file_path.is_absolute():
        return None
    resolved_path = (APP_ROOT / file_path).resolve()
    material_root = (UPLOAD_ROOT / "opc-materials").resolve()
    if resolved_path != material_root and material_root not in resolved_path.parents:
        return None
    return resolved_path
