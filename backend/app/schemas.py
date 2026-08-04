from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SectorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class SectorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class SectorResponse(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PondCreate(BaseModel):
    name: str
    sector_id: int | None = None
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
    sector_id: int | None = None
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

# ==================== DRUG WAREHOUSE ====================
class DrugProductCreate(BaseModel):
    name: str
    category: str
    manufacturer: str | None = None
    supplier: str | None = None
    active_ingredient: str | None = None
    concentration: str | None = None
    unit: str = "ədəd"
    batch_number: str | None = None
    manufacture_date: date | None = None
    expiry_date: date | None = None
    unit_price: float = Field(default=0, ge=0)
    minimum_stock: float = Field(default=0, ge=0)
    storage_condition: str | None = None
    notes: str | None = None

class DrugProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    manufacturer: str | None = None
    supplier: str | None = None
    active_ingredient: str | None = None
    concentration: str | None = None
    unit: str | None = None
    batch_number: str | None = None
    manufacture_date: date | None = None
    expiry_date: date | None = None
    unit_price: float | None = Field(default=None, ge=0)
    minimum_stock: float | None = Field(default=None, ge=0)
    storage_condition: str | None = None
    notes: str | None = None

class DrugProductResponse(DrugProductCreate):
    id: int
    current_stock: float
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DrugTransactionCreate(BaseModel):
    product_id: int
    transaction_type: str
    quantity: float = Field(gt=0)
    transaction_date: date = Field(default_factory=date.today)
    unit_price: float | None = Field(default=None, ge=0)
    purpose: str | None = None
    notes: str | None = None

class DrugTransactionUpdate(BaseModel):
    transaction_type: str | None = None
    quantity: float | None = Field(default=None, gt=0)
    transaction_date: date | None = None
    unit_price: float | None = Field(default=None, ge=0)
    purpose: str | None = None
    notes: str | None = None

class DrugTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: str
    quantity: float
    transaction_date: date
    unit_price: float | None
    purpose: str | None
    notes: str | None
    document_path: str | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== SALES ====================
class SaleCreate(BaseModel):
    sale_date: date = Field(default_factory=date.today)
    pond_id: int | None = None
    source_type: str = "Hovuz"
    cold_storage_batch_id: int | None = None
    source_type: str = "Hovuz"
    cold_storage_batch_id: int | None = None
    customer_name: str
    customer_phone: str | None = None
    invoice_number: str | None = None
    species: str
    sale_form: str
    fish_count: int = Field(gt=0)
    total_weight_kg: float = Field(gt=0)
    price_per_kg: float = Field(ge=0)
    payment_status: str = "Ödənilməyib"
    paid_amount: float = Field(default=0, ge=0)
    notes: str | None = None

class SaleUpdate(BaseModel):
    sale_date: date | None = None
    pond_id: int | None = None
    source_type: str | None = None
    cold_storage_batch_id: int | None = None
    source_type: str | None = None
    cold_storage_batch_id: int | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    invoice_number: str | None = None
    species: str | None = None
    sale_form: str | None = None
    fish_count: int | None = Field(default=None, gt=0)
    total_weight_kg: float | None = Field(default=None, gt=0)
    price_per_kg: float | None = Field(default=None, ge=0)
    payment_status: str | None = None
    paid_amount: float | None = Field(default=None, ge=0)
    notes: str | None = None

class SaleResponse(BaseModel):
    id: int
    sale_date: date
    pond_id: int | None
    source_type: str
    cold_storage_batch_id: int | None
    customer_name: str
    customer_phone: str | None
    invoice_number: str | None
    species: str
    sale_form: str
    fish_count: int
    total_weight_kg: float
    price_per_kg: float
    total_amount: float
    payment_status: str
    paid_amount: float
    notes: str | None
    document_path: str | None = None
    stock_deducted: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== COLD STORAGE ====================
class ColdStorageCreate(BaseModel):
    received_date: date = Field(default_factory=date.today)
    species: str
    product_form: str
    source_pond_id: int | None = None
    source_note: str | None = None
    batch_number: str | None = None
    fish_count: int = Field(gt=0)
    weight_kg: float = Field(gt=0)
    storage_temperature: float | None = None
    expiry_date: date | None = None
    notes: str | None = None

class ColdStorageUpdate(BaseModel):
    received_date: date | None = None
    species: str | None = None
    product_form: str | None = None
    source_pond_id: int | None = None
    source_note: str | None = None
    batch_number: str | None = None
    storage_temperature: float | None = None
    expiry_date: date | None = None
    notes: str | None = None

class ColdStorageResponse(BaseModel):
    id: int
    received_date: date
    species: str
    product_form: str
    source_pond_id: int | None
    source_note: str | None
    batch_number: str | None
    initial_fish_count: int
    current_fish_count: int
    initial_weight_kg: float
    current_weight_kg: float
    storage_temperature: float | None
    expiry_date: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ==================== PERSONNEL ====================
class EmployeeCreate(BaseModel):
    employee_code:str
    full_name:str
    fin_code:str|None=None
    birth_date:date|None=None
    gender:str|None=None
    phone:str|None=None
    address:str|None=None
    department:str
    position:str
    hire_date:date=Field(default_factory=date.today)
    termination_date:date|None=None
    monthly_salary:float=Field(default=0,ge=0)
    shift:str|None=None
    status:str="İşləyir"
    notes:str|None=None

class EmployeeUpdate(BaseModel):
    employee_code:str|None=None
    full_name:str|None=None
    fin_code:str|None=None
    birth_date:date|None=None
    gender:str|None=None
    phone:str|None=None
    address:str|None=None
    department:str|None=None
    position:str|None=None
    hire_date:date|None=None
    termination_date:date|None=None
    monthly_salary:float|None=Field(default=None,ge=0)
    shift:str|None=None
    status:str|None=None
    notes:str|None=None

class EmployeeResponse(EmployeeCreate):
    id:int
    photo_path:str|None=None
    created_at:datetime
    updated_at:datetime
    model_config=ConfigDict(from_attributes=True)

class AttendanceCreate(BaseModel):
    attendance_date:date=Field(default_factory=date.today)
    status:str
    check_in:str|None=None
    check_out:str|None=None
    worked_hours:float=Field(default=0,ge=0,le=24)
    notes:str|None=None
class AttendanceResponse(AttendanceCreate):
    id:int
    employee_id:int
    created_at:datetime
    model_config=ConfigDict(from_attributes=True)

class SalaryPaymentCreate(BaseModel):
    payment_date:date=Field(default_factory=date.today)
    salary_period:str
    base_salary:float=Field(default=0,ge=0)
    advance_amount:float=Field(default=0,ge=0)
    bonus_amount:float=Field(default=0,ge=0)
    deduction_amount:float=Field(default=0,ge=0)
    paid_amount:float=Field(default=0,ge=0)
    notes:str|None=None
class SalaryPaymentResponse(SalaryPaymentCreate):
    id:int
    employee_id:int
    created_at:datetime
    model_config=ConfigDict(from_attributes=True)

class EmployeeDocumentResponse(BaseModel):
    id:int
    employee_id:int
    document_type:str
    document_path:str
    notes:str|None
    created_at:datetime
    model_config=ConfigDict(from_attributes=True)


# ==================== FISH SPECIALIST ====================
class FishSpecialistCreate(BaseModel):
    record_type: str
    pond_id: int | None = None
    record_date: date = Field(default_factory=date.today)
    title: str = Field(min_length=1, max_length=200)
    water_temperature: float | None = None
    oxygen: float | None = Field(default=None, ge=0)
    fish_condition: str | None = None
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    medication: str | None = None
    responsible_person: str | None = None
    due_date: date | None = None
    status: str = "Açıq"
    result: str | None = None
    notes: str | None = None


class FishSpecialistUpdate(BaseModel):
    record_type: str | None = None
    pond_id: int | None = None
    record_date: date | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    water_temperature: float | None = None
    oxygen: float | None = Field(default=None, ge=0)
    fish_condition: str | None = None
    symptoms: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    medication: str | None = None
    responsible_person: str | None = None
    due_date: date | None = None
    status: str | None = None
    result: str | None = None
    notes: str | None = None


class FishSpecialistResponse(FishSpecialistCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== TEMPERATURE STATISTICS ====================
class TemperatureCreate(BaseModel):
    record_date: date = Field(default_factory=date.today)
    temperature_c: float = Field(ge=-10, le=50)
    source: str = "Əl ilə"
    notes: str | None = Field(default=None, max_length=500)


class TemperatureUpdate(BaseModel):
    record_date: date | None = None
    temperature_c: float | None = Field(default=None, ge=-10, le=50)
    source: str | None = None
    notes: str | None = Field(default=None, max_length=500)


class TemperatureResponse(TemperatureCreate):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
