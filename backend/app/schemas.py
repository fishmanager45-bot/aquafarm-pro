from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class PondCreate(BaseModel):
    name: str
    unit_type: str = "Hovuz"
    area_m2: float = 0
    species: str | None = None
    birth_year: int | None = Field(
        default=None,
        ge=1900,
        le=date.today().year,
    )
    sex: str | None = "Naməlum"
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
    birth_year: int | None = Field(
        default=None,
        ge=1900,
        le=date.today().year,
    )
    sex: str | None = None
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
    birth_year: int | None = Field(
        default=None,
        ge=1900,
        le=date.today().year,
    )
    sex: str | None = "Naməlum"
    fish_count: int = Field(ge=0)
    average_weight_g: float = Field(ge=0)
    status: str = "Aktiv"


class FishBatchUpdate(BaseModel):
    batch_code: str | None = None
    pond_id: int | None = None
    species: str | None = None
    birth_year: int | None = Field(
        default=None,
        ge=1900,
        le=date.today().year,
    )
    sex: str | None = None
    fish_count: int | None = Field(default=None, ge=0)
    average_weight_g: float | None = Field(default=None, ge=0)
    status: str | None = None


class FishBatchResponse(BaseModel):
    id: int
    batch_code: str
    pond_id: int
    species: str
    birth_year: int | None
    sex: str | None
    fish_count: int
    average_weight_g: float
    biomass_kg: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MortalityCreate(BaseModel):
    pond_id: int
    fish_batch_id: int | None = None
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
    fish_batch_id: int | None = None
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


class MortalityPhotoResponse(BaseModel):
    id: int
    mortality_record_id: int
    photo_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MortalityResponse(BaseModel):
    id: int
    pond_id: int
    fish_batch_id: int | None
    record_date: date
    dead_count: int
    average_weight_g: float
    species: str | None
    birth_year: int | None
    sex: str | None
    mortality_biomass_kg: float
    reason: str | None
    notes: str | None
    photo_path: str | None = None
    photos: list[MortalityPhotoResponse] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MortalitySummary(BaseModel):
    period: str
    total_dead_count: int
    total_biomass_kg: float


class FeedingRuleCreate(BaseModel):
    species: str
    min_weight_g: float = Field(ge=0)
    max_weight_g: float = Field(gt=0)
    feed_percent: float = Field(ge=0, le=100)
    is_active: bool = True


class FeedingRuleUpdate(BaseModel):
    species: str | None = None
    min_weight_g: float | None = Field(default=None, ge=0)
    max_weight_g: float | None = Field(default=None, gt=0)
    feed_percent: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    is_active: bool | None = None


class FeedingRuleResponse(BaseModel):
    id: int
    species: str
    min_weight_g: float
    max_weight_g: float
    feed_percent: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedingGroupResponse(BaseModel):
    batch_id: int
    batch_code: str
    pond_id: int
    pond_name: str
    unit_type: str
    species: str
    birth_year: int | None
    age_years: int | None
    sex: str | None
    fish_count: int
    average_weight_g: float
    biomass_kg: float
    feeding_rule_id: int | None
    feed_percent: float
    daily_feed_kg: float


class GrowthCreate(BaseModel):
    pond_id: int
    measurement_date: date = Field(default_factory=date.today)
    fish_count: int = Field(ge=0)
    average_weight_g: float = Field(gt=0)
    feed_used_kg: float = Field(default=0, ge=0)
    notes: str | None = None


class GrowthUpdate(BaseModel):
    measurement_date: date | None = None
    fish_count: int | None = Field(default=None, ge=0)
    average_weight_g: float | None = Field(default=None, gt=0)
    feed_used_kg: float | None = Field(default=None, ge=0)
    notes: str | None = None


class GrowthResponse(BaseModel):
    id: int
    pond_id: int
    measurement_date: date
    fish_count: int
    average_weight_g: float
    feed_used_kg: float
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GrowthCalculation(BaseModel):
    record_id: int
    pond_id: int
    measurement_date: date
    previous_date: date | None = None
    previous_weight_g: float | None = None
    current_weight_g: float
    days_between: int | None = None
    weight_gain_g: float | None = None
    daily_weight_gain_g: float | None = None
    growth_percent: float | None = None
    sgr_percent_day: float | None = None
    previous_biomass_kg: float | None = None
    current_biomass_kg: float
    biomass_gain_kg: float | None = None
    feed_used_kg: float
    fcr: float | None = None


# ==================== FEED WAREHOUSE ====================
class FeedProductCreate(BaseModel):
    brand: str
    product_name: str
    species: str | None = None
    pellet_size_mm: float | None = Field(default=None, ge=0)
    batch_number: str | None = None
    supplier: str | None = None
    manufacture_date: date | None = None
    expiry_date: date | None = None
    unit_price: float = Field(default=0, ge=0)
    minimum_stock_kg: float = Field(default=0, ge=0)
    notes: str | None = None


class FeedProductUpdate(BaseModel):
    brand: str | None = None
    product_name: str | None = None
    species: str | None = None
    pellet_size_mm: float | None = Field(default=None, ge=0)
    batch_number: str | None = None
    supplier: str | None = None
    manufacture_date: date | None = None
    expiry_date: date | None = None
    unit_price: float | None = Field(default=None, ge=0)
    minimum_stock_kg: float | None = Field(default=None, ge=0)
    notes: str | None = None


class FeedProductResponse(BaseModel):
    id: int
    brand: str
    product_name: str
    species: str | None
    pellet_size_mm: float | None
    batch_number: str | None
    supplier: str | None
    manufacture_date: date | None
    expiry_date: date | None
    unit_price: float
    minimum_stock_kg: float
    current_stock_kg: float
    notes: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FeedTransactionCreate(BaseModel):
    product_id: int
    transaction_type: str
    quantity_kg: float = Field(gt=0)
    transaction_date: date = Field(default_factory=date.today)
    unit_price: float | None = Field(default=None, ge=0)
    notes: str | None = None


class FeedTransactionUpdate(BaseModel):
    transaction_type: str | None = None
    quantity_kg: float | None = Field(default=None, gt=0)
    transaction_date: date | None = None
    unit_price: float | None = Field(default=None, ge=0)
    notes: str | None = None


class FeedTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: str
    quantity_kg: float
    transaction_date: date
    unit_price: float | None
    notes: str | None
    document_path: str | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== BROODSTOCK ====================
class BroodstockCreate(BaseModel):
    chip_number: str
    species: str
    sex: str
    birth_year: int | None = Field(default=None, ge=1900, le=date.today().year)
    pond_id: int | None = None
    weight_kg: float | None = Field(default=None, ge=0)
    length_cm: float | None = Field(default=None, ge=0)
    origin: str | None = None
    status: str = "Aktiv"
    notes: str | None = None

class BroodstockUpdate(BaseModel):
    chip_number: str | None = None
    species: str | None = None
    sex: str | None = None
    birth_year: int | None = Field(default=None, ge=1900, le=date.today().year)
    pond_id: int | None = None
    weight_kg: float | None = Field(default=None, ge=0)
    length_cm: float | None = Field(default=None, ge=0)
    origin: str | None = None
    status: str | None = None
    notes: str | None = None

class BroodstockResponse(BroodstockCreate):
    id: int
    photo_path: str | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BroodstockUseCreate(BaseModel):
    use_date: date = Field(default_factory=date.today)
    use_type: str
    amount: float | None = Field(default=None, ge=0)
    fertilization_percent: float | None = Field(default=None, ge=0, le=100)
    hatch_percent: float | None = Field(default=None, ge=0, le=100)
    hormone: str | None = None
    hormone_dose: str | None = None
    result: str | None = None
    notes: str | None = None

class BroodstockUseResponse(BroodstockUseCreate):
    id: int
    broodstock_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PolarizationCreate(BaseModel):
    measurement_date: date = Field(default_factory=date.today)
    average_value: float = Field(ge=0)
    minimum_value: float | None = Field(default=None, ge=0)
    maximum_value: float | None = Field(default=None, ge=0)
    egg_count: int | None = Field(default=None, ge=0)
    ready_for_use: bool = False
    notes: str | None = None

class PolarizationResponse(PolarizationCreate):
    id: int
    broodstock_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

