from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Pond(Base):
    __tablename__ = "ponds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    species: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fish_count: Mapped[int] = mapped_column(Integer, default=0)
    average_weight_g: Mapped[float] = mapped_column(Float, default=0)
    water_temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    oxygen: Mapped[float | None] = mapped_column(Float, nullable=True)
    daily_feed_kg: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[str] = mapped_column(String(30), default="Aktiv")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
    )