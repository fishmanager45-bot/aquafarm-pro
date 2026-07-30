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
class FishBatchCreate(BaseModel):
    batch_code: str
    pond_id: int
    species: str
    fish_count: int
    average_weight_g: float
    status: str = "Aktiv"


class FishBatchUpdate(BaseModel):
    batch_code: str | None = None
    pond_id: int | None = None
    species: str | None = None
    fish_count: int | None = None
    average_weight_g: float | None = None
    status: str | None = None


class FishBatchResponse(BaseModel):
    id: int
    batch_code: str
    pond_id: int
    species: str
    fish_count: int
    average_weight_g: float
    biomass_kg: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
