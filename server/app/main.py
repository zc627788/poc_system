from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.admin.auth import router as admin_auth_router
from app.api.admin.content import router as admin_content_router
from app.api.public.auth import router as public_auth_router
from app.api.public.site import router as public_site_router
from app.core.bootstrap import ensure_core_data
from app.core.config import settings


app = FastAPI(title=settings.app_name, debug=settings.app_debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_site_router, prefix="/api/public", tags=["public"])
app.include_router(public_auth_router, prefix="/api/public/auth", tags=["public-auth"])
app.include_router(admin_auth_router, prefix="/api/admin/auth", tags=["admin-auth"])
app.include_router(admin_content_router, prefix="/api/admin", tags=["admin-content"])

workspace_root = Path(__file__).resolve().parents[2]
app.mount("/prototype-assets", StaticFiles(directory=workspace_root), name="prototype-assets")


@app.on_event("startup")
def startup_event() -> None:
    # Bootstrap only the minimum required records.
    # This keeps existing DB content untouched while avoiding seed dependency.
    ensure_core_data()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
