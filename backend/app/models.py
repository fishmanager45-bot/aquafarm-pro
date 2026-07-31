from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Pond(Base):
    __tablename__ = "ponds"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
    )
    unit_type: Mapped[str] = mapped_column(
        String(30),
        default="Hovuz",
        nullable=False,
    )
    area_m2: Mapped[float] = mapped_column(
        Float,
        default=0,
        nullable=False,
    )
    species: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    fish_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )
    average_weight_g: Mapped[float] = mapped_column(
        Float,
        default=0,
    )
    water_temperature: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    oxygen: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )
    daily_feed_kg: Mapped[float] = mapped_column(
        Float,
        default=0,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="Aktiv",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
    )
    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
    )
    role: Mapped[str] = mapped_column(
        String(30),
        default="operator",
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="Aktiv",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )


class FishBatch(Base):
    __tablename__ = "fish_batches"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )
    batch_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
    )
    pond_id: Mapped[int] = mapped_column(
        ForeignKey("ponds.id"),
        index=True,
    )
    species: Mapped[str] = mapped_column(
        String(100),
    )
    fish_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )
    average_weight_g: Mapped[float] = mapped_column(
        Float,
        default=0,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="Aktiv",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )

    @property
    def biomass_kg(self) -> float:
        return round(
            self.fish_count * self.average_weight_g / 1000,
            3,
        )


class MortalityRecord(Base):
    __tablename__ = "mortality_records"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )
    pond_id: Mapped[int] = mapped_column(
        ForeignKey("ponds.id"),
        index=True,
        nullable=False,
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
        String(100),
        nullable=True,
    )
    birth_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    sex: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    reason: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )

    @property
    def mortality_biomass_kg(self) -> float:
        return round(
            self.dead_count * self.average_weight_g / 1000,
            3,
        )