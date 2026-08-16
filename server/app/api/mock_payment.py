from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.payment import get_mock_payment_transaction_by_provider_tx, get_mock_payment_transaction_by_token
from app.schemas.common import ApiResponse
from app.schemas.payment import (
    MockPaymentCompleteRequest,
    MockPaymentCompleteResponse,
    MockPaymentCreateRequest,
    MockPaymentTransactionResponse,
    StatementEntryResponse,
)
from app.services.mock_payment_provider import (
    MockPaymentProviderError,
    build_mock_checkout_html,
    complete_mock_payment,
    trigger_mock_payment_notification,
)


router = APIRouter(prefix="/mock-payment")


def _mock_response(item) -> MockPaymentTransactionResponse:
    return MockPaymentTransactionResponse(
        provider_transaction_no=item.provider_transaction_no,
        payment_no=item.payment_no,
        order_no=item.order_no,
        amount=item.amount,
        currency=item.currency,
        status=item.status,
        notification_mode=item.notification_mode,
        notification_status=item.notification_status,
        completed_at=item.completed_at,
        return_url=item.return_url,
    )


@router.get("/checkout/{checkout_token}", response_class=HTMLResponse)
def mock_checkout(
    checkout_token: str,
    db: Session = Depends(get_db),
) -> HTMLResponse:
    item = get_mock_payment_transaction_by_token(db, checkout_token)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="收银台交易不存在")
    return HTMLResponse(content=build_mock_checkout_html(item))


@router.post("/transactions", response_model=ApiResponse[MockPaymentTransactionResponse])
def create_mock_transaction(
    payload: MockPaymentCreateRequest = Body(...),
    db: Session = Depends(get_db),
) -> ApiResponse[MockPaymentTransactionResponse]:
    from app.services.mock_payment_provider import MockPaymentProvider
    from app.services.payment_provider import CreatePaymentRequest

    provider = MockPaymentProvider(db)
    created = provider.create_payment(
        CreatePaymentRequest(
            payment_no=payload.payment_no,
            order_no=payload.order_no,
            amount=payload.amount,
            currency=payload.currency,
            subject=payload.subject,
            notify_url=payload.notify_url,
            return_url=payload.return_url,
            api_base_url=payload.api_base_url,
        )
    )
    db.commit()
    item = get_mock_payment_transaction_by_provider_tx(db, created.provider_transaction_no)
    if item is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Mock 交易创建失败")
    return ApiResponse(data=_mock_response(item))


@router.post("/checkout/{checkout_token}/complete", response_model=ApiResponse[MockPaymentCompleteResponse])
def complete_checkout(
    checkout_token: str,
    payload: MockPaymentCompleteRequest = Body(...),
    db: Session = Depends(get_db),
) -> ApiResponse[MockPaymentCompleteResponse]:
    try:
        item = complete_mock_payment(db, checkout_token, payload.result, payload.notification_mode)
        db.commit()
        trigger_mock_payment_notification(item.provider_transaction_no, payload.notification_mode)
    except MockPaymentProviderError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return ApiResponse(
        data=MockPaymentCompleteResponse(
            provider_transaction_no=item.provider_transaction_no,
            status=item.status,
            return_url=item.return_url,
        )
    )


@router.get("/transactions/{provider_transaction_no}", response_model=ApiResponse[MockPaymentTransactionResponse])
def get_mock_transaction(
    provider_transaction_no: str,
    db: Session = Depends(get_db),
) -> ApiResponse[MockPaymentTransactionResponse]:
    item = get_mock_payment_transaction_by_provider_tx(db, provider_transaction_no)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="平台交易不存在")
    return ApiResponse(data=_mock_response(item))


@router.get("/statements/{statement_date}", response_model=ApiResponse[list[StatementEntryResponse]])
def get_mock_statement(
    statement_date: str,
    db: Session = Depends(get_db),
) -> ApiResponse[list[StatementEntryResponse]]:
    from datetime import date

    from app.services.billing_payment import get_payment_provider

    try:
        parsed = date.fromisoformat(statement_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="对账日期格式不合法") from exc
    provider = get_payment_provider(db, "MOCK")
    return ApiResponse(
        data=[
            StatementEntryResponse(
                payment_no=item.payment_no,
                provider_transaction_no=item.provider_transaction_no,
                order_no=item.order_no,
                amount=item.amount,
                currency=item.currency,
                status=item.status,
                completed_at=item.completed_at,
            )
            for item in provider.download_statement(parsed)
        ]
    )
