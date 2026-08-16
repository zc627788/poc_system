from pathlib import Path
from urllib.parse import quote

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.admin.auth import router as admin_auth_router
from app.api.admin.billing import router as admin_billing_router
from app.api.admin.billing_orders import router as admin_billing_orders_router
from app.api.admin.billing_prepaid import router as admin_billing_prepaid_router
from app.api.admin.billing_reconciliations import router as admin_billing_reconciliations_router
from app.api.admin.community_join import router as admin_community_join_router
from app.api.admin.content import router as admin_content_router
from app.api.admin.opc_application import router as admin_opc_application_router
from app.api.admin.trusted_dataspace import router as admin_trusted_dataspace_router
from app.api.mock_payment import router as mock_payment_router
from app.api.payment_notifications import router as payment_notifications_router
from app.api.public.auth import router as public_auth_router
from app.api.public.billing import router as public_billing_router
from app.api.public.billing_orders import router as public_billing_orders_router
from app.api.public.billing_prepaid import router as public_billing_prepaid_router
from app.api.public.community_join import router as public_community_join_router
from app.api.public.opc_application import router as public_opc_application_router
from app.api.public.site import router as public_site_router
from app.api.public.wallet import router as public_wallet_router
from app.api.public.trusted_dataspace import router as public_trusted_dataspace_router
from app.core.bootstrap import ensure_core_data
from app.core.config import settings
from app.features.application_form.api.draft import router as application_form_draft_router
from app.features.application_form.api.images import router as application_form_images_router
from app.features.application_form.api.submit import router as application_form_submit_router
from app.services.billing_payment import should_register_mock_payment_routes, validate_payment_settings
from app.services.opc_upload_storage import UPLOAD_ROOT


app = FastAPI(title=settings.app_name, debug=settings.app_debug)
validate_payment_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_site_router, prefix="/api/public", tags=["public"])
app.include_router(public_auth_router, prefix="/api/public/auth", tags=["public-auth"])
app.include_router(public_billing_router, prefix="/api/public", tags=["public-billing"])
app.include_router(public_billing_orders_router, prefix="/api/public", tags=["public-billing-orders"])
app.include_router(public_billing_prepaid_router, prefix="/api/public", tags=["public-billing-prepaid"])
app.include_router(public_wallet_router, prefix="/api/public", tags=["public-wallet"])
app.include_router(public_trusted_dataspace_router, prefix="/api/public", tags=["public-trusted-data-space"])
app.include_router(public_opc_application_router, prefix="/api/public", tags=["public-opc-application"])
app.include_router(public_community_join_router, prefix="/api/public", tags=["public-community-join"])
app.include_router(application_form_submit_router, prefix="/api/public", tags=["public-application-form"])
app.include_router(application_form_draft_router, prefix="/api/public", tags=["public-application-form"])
app.include_router(application_form_images_router, prefix="/api/public", tags=["public-application-form"])
app.include_router(payment_notifications_router, prefix="/api", tags=["payment-notifications"])
app.include_router(admin_auth_router, prefix="/api/admin/auth", tags=["admin-auth"])
app.include_router(admin_billing_router, prefix="/api/admin", tags=["admin-billing"])
app.include_router(admin_billing_orders_router, prefix="/api/admin", tags=["admin-billing-orders"])
app.include_router(admin_billing_prepaid_router, prefix="/api/admin", tags=["admin-billing-prepaid"])
app.include_router(admin_billing_reconciliations_router, prefix="/api/admin", tags=["admin-billing-reconciliations"])
app.include_router(admin_content_router, prefix="/api/admin", tags=["admin-content"])
app.include_router(admin_opc_application_router, prefix="/api/admin", tags=["admin-opc-application"])
app.include_router(admin_trusted_dataspace_router, prefix="/api/admin", tags=["admin-trusted-data-space"])
app.include_router(admin_community_join_router, prefix="/api/admin", tags=["admin-community-join"])
if should_register_mock_payment_routes():
    app.include_router(mock_payment_router, prefix="/api", tags=["mock-payment"])

workspace_root = Path(__file__).resolve().parents[2]
app.mount("/prototype-assets", StaticFiles(directory=workspace_root), name="prototype-assets")
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


def build_attachment_filename_header(file_name: str) -> str:
    encoded = quote(file_name)
    ascii_fallback = "".join(ch if ord(ch) < 128 else "_" for ch in file_name) or "download.bin"
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded}"


@app.get("/uploads/{file_path:path}")
def download_upload(file_path: str) -> FileResponse:
    safe_relative_path = Path(file_path)
    resolved = (UPLOAD_ROOT / safe_relative_path).resolve()
    if resolved != UPLOAD_ROOT.resolve() and UPLOAD_ROOT.resolve() not in resolved.parents:
        raise HTTPException(status_code=404, detail="File not found")
    if not resolved.exists() or not resolved.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    response = FileResponse(path=str(resolved), filename=resolved.name)
    response.headers["Content-Disposition"] = build_attachment_filename_header(resolved.name)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = "default-src 'none'; sandbox"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.on_event("startup")
def startup_event() -> None:
    # Bootstrap only the minimum required records.
    # This keeps existing DB content untouched while avoiding seed dependency.
    ensure_core_data()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
