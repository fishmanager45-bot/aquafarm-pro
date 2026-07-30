from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PondCreate(BaseModel):
    name: str
    species: str | None = None
    fish_count: int = 0
    average_weight_g: float = 0
    water_temperature: float | None = None
    oxygen: float | None = None
    daily_feed_kg: float = 0
    status: str = "Aktiv"


class PondResponse(PondCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
class PondUpdate(BaseModel):
    name: str | None = None
    species: str | None = None
    fish_count: int | None = None
    average_weight_g: float | None = None
    water_temperature: float | None = None
    oxygen: float | None = None
    daily_feed_kg: float | None = None
    status: str | None = None
class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "operator"


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"