from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Pond(Base):
    __tablename__ = "ponds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    unit_type: Mapped[str] = mapped_column(
        String(30), default="Hovuz", nullable=False
    )
    area_m2: Mapped[float] = mapped_column(
        Float, default=0, nullable=False
    )
    species: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    birth_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    sex: Mapped[str | None] = mapped_column(
        String(20), default="Naməlum", nullable=True
    )
    fish_count: Mapped[int] = mapped_column(Integer, default=0)
    average_weight_g: Mapped[float] = mapped_column(Float, default=0)
    water_temperature: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    oxygen: Mapped[float | None] = mapped_column(Float, nullable=True)
    daily_feed_kg: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="Aktiv")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(
        String(150), unique=True, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="operator")
    status: Mapped[str] = mapped_column(String(30), default="Aktiv")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now
    )


class FishBatch(Base):
    __tablename__ = "fish_batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    batch_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True
    )
    pond_id: Mapped[int] = mapped_column(
        ForeignKey("ponds.id"), index=True
    )
    species: Mapped[str] = mapped_column(String(100))
    birth_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    sex: Mapped[str | None] = mapped_column(
        String(20), default="Naməlum", nullable=True
    )
    fish_count: Mapped[int] = mapped_column(Integer, default=0)
    average_weight_g: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="Aktiv")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now
    )

    @property
    def biomass_kg(self) -> float:
        return round(
            self.fish_count * self.average_weight_g / 1000,
            3,
        )


class MortalityRecord(Base):
    __tablename__ = "mortality_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    pond_id: Mapped[int] = mapped_column(
        ForeignKey("ponds.id"),
        index=True,
        nullable=False,
    )

    fish_batch_id: Mapped[int | None] = mapped_column(
        ForeignKey("fish_batches.id"),
        index=True,
        nullable=True,
    )

    record_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        index=True,
        nullable=False,
    )

    dead_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    average_weight_g: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    species: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    birth_year: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    sex: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )

    reason: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    photo_path: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    stock_deducted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )

    photos: Mapped[list["MortalityPhoto"]] = relationship(
        back_populates="mortality_record",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def mortality_biomass_kg(self) -> float:
        return round(
            self.dead_count * self.average_weight_g / 1000,
            3,
        )


class MortalityPhoto(Base):
    __tablename__ = "mortality_photos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    mortality_record_id: Mapped[int] = mapped_column(
        ForeignKey(
            "mortality_records.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    photo_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )

    mortality_record: Mapped["MortalityRecord"] = relationship(
        back_populates="photos",
    )
class FeedingRule(Base):
    __tablename__ = "feeding_rules"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    species: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    min_weight_g: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    max_weight_g: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    feed_percent: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
    )

class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    pond_id: Mapped[int] = mapped_column(
        ForeignKey("ponds.id"),
        nullable=False,
        index=True,
    )

    measurement_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    fish_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    average_weight_g: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    feed_used_kg: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    pond: Mapped["Pond"] = relationship()


# ==================== FEED WAREHOUSE ====================
class FeedProduct(Base):
    __tablename__ = "feed_products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    brand: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    species: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pellet_size_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    supplier: Mapped[str | None] = mapped_column(String(150), nullable=True)
    manufacture_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    minimum_stock_kg: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    current_stock_kg: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


class FeedStockTransaction(Base):
    __tablename__ = "feed_stock_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("feed_products.id"), index=True, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, default=date.today, index=True, nullable=False)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    document_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)


# ==================== BROODSTOCK ====================
class BroodstockFish(Base):
    __tablename__ = "broodstock_fish"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    chip_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    species: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    sex: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    birth_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pond_id: Mapped[int | None] = mapped_column(ForeignKey("ponds.id"), index=True, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    length_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    origin: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Aktiv", index=True, nullable=False)
    photo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


class BroodstockUseRecord(Base):
    __tablename__ = "broodstock_use_records"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    broodstock_id: Mapped[int] = mapped_column(ForeignKey("broodstock_fish.id", ondelete="CASCADE"), index=True, nullable=False)
    use_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    use_type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    fertilization_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    hatch_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    hormone: Mapped[str | None] = mapped_column(String(150), nullable=True)
    hormone_dose: Mapped[str | None] = mapped_column(String(100), nullable=True)
    result: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)


class PolarizationRecord(Base):
    __tablename__ = "polarization_records"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    broodstock_id: Mapped[int] = mapped_column(ForeignKey("broodstock_fish.id", ondelete="CASCADE"), index=True, nullable=False)
    measurement_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    average_value: Mapped[float] = mapped_column(Float, nullable=False)
    minimum_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    maximum_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    egg_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ready_for_use: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)

# ==================== DRUG WAREHOUSE ====================
class DrugProduct(Base):
    __tablename__ = "drug_products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    manufacturer: Mapped[str | None] = mapped_column(String(150), nullable=True)
    supplier: Mapped[str | None] = mapped_column(String(150), index=True, nullable=True)
    active_ingredient: Mapped[str | None] = mapped_column(String(200), nullable=True)
    concentration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="ədəd", nullable=False)
    batch_number: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    manufacture_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expiry_date: Mapped[date | None] = mapped_column(Date, index=True, nullable=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    minimum_stock: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    current_stock: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    storage_condition: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


class DrugStockTransaction(Base):
    __tablename__ = "drug_stock_transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("drug_products.id"), index=True, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, default=date.today, index=True, nullable=False)
    unit_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    document_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
