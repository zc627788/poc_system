from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginData, LoginRequest
from app.schemas.common import ApiResponse
from app.services.auth import login_admin_user


router = APIRouter()


@router.post("/login", response_model=ApiResponse[LoginData])
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> ApiResponse[LoginData]:
    result = login_admin_user(db, payload.username, payload.password)
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid username or password")
    return ApiResponse(data=result)

