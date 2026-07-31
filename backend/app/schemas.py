from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PondCreate(BaseModel):
    name: str
    unit_type: str = "Hovuz"
    area_m2: float = 0
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
    unit_type: str | None = None
    area_m2: float | None = None
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


class MortalityCreate(BaseModel):
    pond_id: int
    record_date: date = Field(default_factory=date.today)
    dead_count: int = Field(ge=1)
    average_weight_g: float = Field(default=0, ge=0)
    species: str | None = None
    birth_year: int | None = Field(
        default=None,
        ge=1900,
        le=date.today().year,
    )
    sex: str | None = None
    reason: str | None = None
    notes: str | None = None


class MortalityUpdate(BaseModel):
    pond_id: int | None = None
    record_date: date | None = None
    dead_count: int | None = Field(default=None, ge=1)
    average_weight_g: float | None = Field(default=None, ge=0)
    species: str | None = None
    birth_year: int | None = Field(
        default=None,
        ge=1900,
        le=date.today().year,
    )
    sex: str | None = None
    reason: str | None = None
    notes: str | None = None


class MortalityResponse(BaseModel):
    id: int
    pond_id: int
    record_date: date
    dead_count: int
    average_weight_g: float
    species: str | None
    birth_year: int | None
    sex: str | None
    mortality_biomass_kg: float
    reason: str | None
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MortalitySummary(BaseModel):
    period: str
    total_dead_count: int
    total_biomass_kg: float