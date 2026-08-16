from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.services.billing_payment import (
    PaymentNotificationUnauthorizedError,
    PaymentValidationError,
    process_payment_notification,
)


router = APIRouter(prefix="/payment/notifications")


@router.post("/{provider}", response_model=ApiResponse[dict[str, bool]])
async def handle_payment_notification(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
) -> ApiResponse[dict[str, bool]]:
    body = await request.body()
    try:
        process_payment_notification(db, provider, request.headers, body)
    except PaymentNotificationUnauthorizedError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except PaymentValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ApiResponse(data={"ok": True})
