from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginUser(BaseModel):
    id: int
    username: str
    name: str


class LoginData(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 7200
    user: LoginUser


class SiteUserRegisterRequest(BaseModel):
    name: str
    phone: str
    password: str


class SiteUserLoginRequest(BaseModel):
    phone: str
    password: str


class SiteUserProfile(BaseModel):
    id: int
    name: str
    phone: str
    status: int
    created_at: str
    last_login_at: str | None = None


class SiteUserAuthData(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 7200
    user: SiteUserProfile
