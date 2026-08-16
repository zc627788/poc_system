from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.public.auth import require_site_user_auth
from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.prepaid_billing import BalanceSummaryResponse, ConsumptionRecordListResponse
from app.services.prepaid_billing import (
    get_public_balance_summaries,
    get_public_consumption_records,
)


router = APIRouter(prefix="/billing")


@router.get("/balances", response_model=ApiResponse[list[BalanceSummaryResponse]])
def list_public_balances(
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[list[BalanceSummaryResponse]]:
    return ApiResponse(data=get_public_balance_summaries(db, site_user_id))


@router.get("/consumptions", response_model=ApiResponse[ConsumptionRecordListResponse])
def list_public_consumptions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    service_code: str | None = Query(default=None),
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    order_no: str | None = Query(default=None),
    site_user_id: int = Depends(require_site_user_auth),
    db: Session = Depends(get_db),
) -> ApiResponse[ConsumptionRecordListResponse]:
    if start_at and end_at and start_at > end_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="开始时间不能晚于结束时间")
    return ApiResponse(
        data=get_public_consumption_records(db, site_user_id, page, page_size, service_code, start_at, end_at, order_no)
    )
