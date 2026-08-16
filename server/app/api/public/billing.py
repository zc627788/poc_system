from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.billing import BillingMode, BillingProductPublicResponse
from app.schemas.common import ApiResponse
from app.services.billing_product import BillingProductNotFoundError, get_public_product, get_public_products


router = APIRouter(prefix="/billing/products", dependencies=[Depends(require_site_user_auth)])


@router.get("", response_model=ApiResponse[list[BillingProductPublicResponse]])
def list_products(
    billing_mode: BillingMode | None = Query(default=None),
    db: Session = Depends(get_db),
) -> ApiResponse[list[BillingProductPublicResponse]]:
    return ApiResponse(data=get_public_products(db, billing_mode))


@router.get("/{product_id}", response_model=ApiResponse[BillingProductPublicResponse])
def get_product(product_id: int, db: Session = Depends(get_db)) -> ApiResponse[BillingProductPublicResponse]:
    try:
        return ApiResponse(data=get_public_product(db, product_id))
    except BillingProductNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
