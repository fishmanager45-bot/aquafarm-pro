import os
from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from app import models, schemas
from app.database import Base, engine, get_db
from app.core.security import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    hash_password,
    verify_password,
)
Base.metadata.create_all(bind=engine)

UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
MORTALITY_UPLOAD_DIR = UPLOAD_ROOT / "mortality"
MORTALITY_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_PHOTO_SIZE = 10 * 1024 * 1024
PHOTO_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

app = FastAPI(
    title="AquaFarm Pro",
    version="1.0.0",
)
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    credentials_error = HTTPException(
        status_code=401,
        detail="Giriş məlumatı etibarsızdır",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_error

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise credentials_error

    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if user is None:
        raise credentials_error

    if user.status != "Aktiv":
        raise HTTPException(
            status_code=403,
            detail="İstifadəçi aktiv deyil",
        )

    return user
@app.get("/")
def home():
    return {
        "message": "AquaFarm Pro işləyir!",
        "status": "OK",
        "database": "Connected",
    }


@app.post(
    "/sectors",
    response_model=schemas.SectorResponse,
    dependencies=[Depends(get_current_user)],
)
def create_sector(
    sector: schemas.SectorCreate,
    db: Session = Depends(get_db),
):
    sector_name = sector.name.strip()
    existing_sector = (
        db.query(models.Sector)
        .filter(func.lower(models.Sector.name) == sector_name.lower())
        .first()
    )
    if existing_sector:
        raise HTTPException(
            status_code=400,
            detail="Bu adda sektor artıq mövcuddur",
        )
    new_sector = models.Sector(
        name=sector_name,
        description=sector.description,
    )
    db.add(new_sector)
    db.commit()
    db.refresh(new_sector)
    return new_sector


@app.get(
    "/sectors",
    response_model=list[schemas.SectorResponse],
    dependencies=[Depends(get_current_user)],
)
def list_sectors(db: Session = Depends(get_db)):
    return db.query(models.Sector).order_by(models.Sector.name).all()


@app.put(
    "/sectors/{sector_id}",
    response_model=schemas.SectorResponse,
    dependencies=[Depends(get_current_user)],
)
def update_sector(
    sector_id: int,
    sector_data: schemas.SectorUpdate,
    db: Session = Depends(get_db),
):
    sector = (
        db.query(models.Sector)
        .filter(models.Sector.id == sector_id)
        .first()
    )
    if not sector:
        raise HTTPException(status_code=404, detail="Sektor tapılmadı")

    updates = sector_data.model_dump(exclude_unset=True)
    if "name" in updates and updates["name"] is not None:
        sector_name = updates["name"].strip()
        duplicate = (
            db.query(models.Sector)
            .filter(
                func.lower(models.Sector.name) == sector_name.lower(),
                models.Sector.id != sector_id,
            )
            .first()
        )
        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Bu adda sektor artıq mövcuddur",
            )
        updates["name"] = sector_name

    for field, value in updates.items():
        setattr(sector, field, value)
    db.commit()
    db.refresh(sector)
    return sector


@app.delete(
    "/sectors/{sector_id}",
    dependencies=[Depends(get_current_user)],
)
def delete_sector(
    sector_id: int,
    db: Session = Depends(get_db),
):
    sector = (
        db.query(models.Sector)
        .filter(models.Sector.id == sector_id)
        .first()
    )
    if not sector:
        raise HTTPException(status_code=404, detail="Sektor tapılmadı")
    pond_count = (
        db.query(models.Pond)
        .filter(models.Pond.sector_id == sector_id)
        .count()
    )
    if pond_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Bu sektorda {pond_count} hovuz var. "
                "Silməzdən əvvəl hovuzları başqa sektora keçirin."
            ),
        )
    db.delete(sector)
    db.commit()
    return {"message": "Sektor uğurla silindi"}


@app.post(
    "/ponds",
    response_model=schemas.PondResponse,
    dependencies=[Depends(get_current_user)],
)
def create_pond(
    pond: schemas.PondCreate,
    db: Session = Depends(get_db),
):
    existing_pond = (
        db.query(models.Pond)
        .filter(models.Pond.name == pond.name)
        .first()
    )

    if existing_pond:
        raise HTTPException(
            status_code=400,
            detail="Bu adda hovuz artıq mövcuddur",
        )

    new_pond = models.Pond(**pond.model_dump())

    db.add(new_pond)
    db.commit()
    db.refresh(new_pond)

    return new_pond


@app.get(
    "/ponds",
    response_model=list[schemas.PondResponse],
    dependencies=[Depends(get_current_user)],
)
def list_ponds(db: Session = Depends(get_db)):
    return db.query(models.Pond).order_by(models.Pond.id).all()
@app.get(
    "/ponds/{pond_id}",
    response_model=schemas.PondResponse,
    dependencies=[Depends(get_current_user)],
)
def get_pond(
    pond_id: int,
    db: Session = Depends(get_db),
):
    pond = db.query(models.Pond).filter(models.Pond.id == pond_id).first()

    if not pond:
        raise HTTPException(status_code=404, detail="Hovuz tapılmadı")

    return pond


@app.put(
    "/ponds/{pond_id}",
    response_model=schemas.PondResponse,
    dependencies=[Depends(get_current_user)],
)
def update_pond(
    pond_id: int,
    pond_data: schemas.PondUpdate,
    db: Session = Depends(get_db),
):
    pond = db.query(models.Pond).filter(models.Pond.id == pond_id).first()

    if not pond:
        raise HTTPException(status_code=404, detail="Hovuz tapılmadı")

    updates = pond_data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(pond, field, value)

    db.commit()
    db.refresh(pond)

    return pond


@app.delete("/ponds/{pond_id}")
def delete_pond(
    pond_id: int,
    db: Session = Depends(get_db),
):
    pond = db.query(models.Pond).filter(models.Pond.id == pond_id).first()

    if not pond:
        raise HTTPException(status_code=404, detail="Hovuz tapılmadı")

    db.delete(pond)
    db.commit()

    return {"message": "Hovuz uğurla silindi"}


@app.post("/auth/register", response_model=schemas.UserResponse)
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    email = user.email.strip().lower()

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Bu e-poçtla istifadəçi artıq mövcuddur",
        )

    new_user = models.User(
        full_name=user.full_name.strip(),
        email=email,
        hashed_password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/auth/login", response_model=schemas.TokenResponse)
def login_user(
    login: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    email = login.email.strip().lower()

    user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if not user or not verify_password(
        login.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="E-poçt və ya şifrə yanlışdır",
        )

    if user.status != "Aktiv":
        raise HTTPException(
            status_code=403,
            detail="İstifadəçi aktiv deyil",
        )

    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.post(
    "/fish-batches",
    response_model=schemas.FishBatchResponse,
    dependencies=[Depends(get_current_user)],
)
def create_fish_batch(
    batch: schemas.FishBatchCreate,
    db: Session = Depends(get_db),
):
    pond = (
        db.query(models.Pond)
        .filter(models.Pond.id == batch.pond_id)
        .first()
    )

    if pond is None:
        raise HTTPException(
            status_code=404,
            detail="Hovuz tapılmadı",
        )

    existing_batch = (
        db.query(models.FishBatch)
        .filter(models.FishBatch.batch_code == batch.batch_code)
        .first()
    )

    if existing_batch:
        raise HTTPException(
            status_code=400,
            detail="Bu kodla balıq partiyası artıq mövcuddur",
        )

    new_batch = models.FishBatch(**batch.model_dump())

    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return new_batch
@app.get(
    "/fish-batches",
    response_model=list[schemas.FishBatchResponse],
    dependencies=[Depends(get_current_user)],
)
def list_fish_batches(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.FishBatch)
        .order_by(models.FishBatch.id)
        .all()
    )

@app.post(
    "/mortality",
    response_model=schemas.MortalityResponse,
    dependencies=[Depends(get_current_user)],
)
def create_mortality_record(
    mortality: schemas.MortalityCreate,
    db: Session = Depends(get_db),
):
    pond = (
        db.query(models.Pond)
        .filter(models.Pond.id == mortality.pond_id)
        .with_for_update()
        .first()
    )

    if pond is None:
        raise HTTPException(
            status_code=404,
            detail="Hovuz tapılmadı",
        )

    if mortality.dead_count > pond.fish_count:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Ölüm sayı hovuzdakı balıq sayından çox ola bilməz. "
                f"Hazırkı balıq sayı: {pond.fish_count}"
            ),
        )

    new_record = models.MortalityRecord(
        **mortality.model_dump(),
        stock_deducted=True,
    )

    pond.fish_count -= mortality.dead_count
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@app.get(
    "/mortality",
    response_model=list[schemas.MortalityResponse],
    dependencies=[Depends(get_current_user)],
)
def list_mortality_records(
    pond_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.MortalityRecord)

    if pond_id is not None:
        query = query.filter(
            models.MortalityRecord.pond_id == pond_id
        )

    if start_date is not None:
        query = query.filter(
            models.MortalityRecord.record_date >= start_date
        )

    if end_date is not None:
        query = query.filter(
            models.MortalityRecord.record_date <= end_date
        )

    return (
        query
        .order_by(
            models.MortalityRecord.record_date.desc(),
            models.MortalityRecord.id.desc(),
        )
        .all()
    )


@app.post(
    "/mortality/{record_id}/photos",
    response_model=schemas.MortalityResponse,
    dependencies=[Depends(get_current_user)],
)
async def upload_mortality_photos(
    record_id: int,
    photos: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.MortalityRecord)
        .filter(models.MortalityRecord.id == record_id)
        .with_for_update()
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Ölüm qeydi tapılmadı",
        )

    if not photos:
        raise HTTPException(
            status_code=400,
            detail="Ən azı bir şəkil seçilməlidir",
        )

    existing_paths = {item.photo_path for item in record.photos}
    legacy_photo_count = int(
        bool(record.photo_path and record.photo_path not in existing_paths)
    )
    current_photo_count = len(record.photos) + legacy_photo_count

    if current_photo_count + len(photos) > 5:
        raise HTTPException(
            status_code=400,
            detail="Bir ölüm qeydinə maksimum 5 şəkil əlavə etmək olar",
        )

    prepared_photos = []

    for photo in photos:
        extension = PHOTO_EXTENSIONS.get(photo.content_type or "")
        if extension is None:
            await photo.close()
            raise HTTPException(
                status_code=400,
                detail="Yalnız JPG, PNG və WEBP şəkilləri qəbul edilir",
            )

        photo_bytes = await photo.read(MAX_PHOTO_SIZE + 1)
        await photo.close()

        if len(photo_bytes) > MAX_PHOTO_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Hər şəklin ölçüsü maksimum 10 MB ola bilər",
            )

        if not photo_bytes:
            raise HTTPException(
                status_code=400,
                detail="Şəkil faylı boşdur",
            )

        filename = f"{uuid4().hex}{extension}"
        prepared_photos.append((filename, photo_bytes))

    written_paths = []

    try:
        for filename, photo_bytes in prepared_photos:
            file_path = MORTALITY_UPLOAD_DIR / filename
            file_path.write_bytes(photo_bytes)
            written_paths.append(file_path)

            db.add(
                models.MortalityPhoto(
                    mortality_record_id=record.id,
                    photo_path=f"/uploads/mortality/{filename}",
                )
            )

        db.commit()
        db.refresh(record)
    except Exception:
        db.rollback()
        for file_path in written_paths:
            file_path.unlink(missing_ok=True)
        raise

    return record


@app.delete(
    "/mortality/{record_id}/photos/{photo_id}",
    dependencies=[Depends(get_current_user)],
)
def delete_mortality_photo(
    record_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
):
    photo = (
        db.query(models.MortalityPhoto)
        .filter(
            models.MortalityPhoto.id == photo_id,
            models.MortalityPhoto.mortality_record_id == record_id,
        )
        .first()
    )

    if photo is None:
        raise HTTPException(
            status_code=404,
            detail="Şəkil tapılmadı",
        )

    photo_path = photo.photo_path
    db.delete(photo)
    db.commit()

    photo_filename = Path(photo_path).name
    (MORTALITY_UPLOAD_DIR / photo_filename).unlink(missing_ok=True)

    return {"message": "Şəkil uğurla silindi"}


@app.get(
    "/mortality/summary",
    response_model=list[schemas.MortalitySummary],
    dependencies=[Depends(get_current_user)],
)
def mortality_summary(
    period: str = "daily",
    year: int | None = None,
    month: int | None = None,
    pond_id: int | None = None,
    db: Session = Depends(get_db),
):
    period_map = {
        "daily": "day",
        "monthly": "month",
        "yearly": "year",
    }

    if period not in period_map:
        raise HTTPException(
            status_code=400,
            detail="Period daily, monthly və ya yearly olmalıdır",
        )

    period_column = func.date_trunc(
        period_map[period],
        models.MortalityRecord.record_date,
    ).label("period")

    total_dead = func.coalesce(
        func.sum(models.MortalityRecord.dead_count),
        0,
    ).label("total_dead_count")

    total_biomass = func.coalesce(
        func.sum(
            models.MortalityRecord.dead_count
            * models.MortalityRecord.average_weight_g
            / 1000
        ),
        0,
    ).label("total_biomass_kg")

    query = db.query(
        period_column,
        total_dead,
        total_biomass,
    )

    if year is not None:
        query = query.filter(
            extract(
                "year",
                models.MortalityRecord.record_date,
            ) == year
        )

    if month is not None:
        query = query.filter(
            extract(
                "month",
                models.MortalityRecord.record_date,
            ) == month
        )

    if pond_id is not None:
        query = query.filter(
            models.MortalityRecord.pond_id == pond_id
        )

    rows = (
        query
        .group_by(period_column)
        .order_by(period_column)
        .all()
    )

    results = []

    for row in rows:
        if period == "daily":
            period_text = row.period.strftime("%Y-%m-%d")
        elif period == "monthly":
            period_text = row.period.strftime("%Y-%m")
        else:
            period_text = row.period.strftime("%Y")

        results.append(
            {
                "period": period_text,
                "total_dead_count": int(
                    row.total_dead_count or 0
                ),
                "total_biomass_kg": round(
                    float(row.total_biomass_kg or 0),
                    3,
                ),
            }
        )

    return results


@app.put(
    "/mortality/{record_id}",
    response_model=schemas.MortalityResponse,
    dependencies=[Depends(get_current_user)],
)
def update_mortality_record(
    record_id: int,
    mortality_data: schemas.MortalityUpdate,
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.MortalityRecord)
        .filter(models.MortalityRecord.id == record_id)
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Ölüm qeydi tapılmadı",
        )

    updates = mortality_data.model_dump(
        exclude_unset=True
    )

    old_pond_id = record.pond_id
    old_dead_count = record.dead_count
    new_pond_id = updates.get("pond_id", old_pond_id)
    new_dead_count = updates.get("dead_count", old_dead_count)

    pond_ids = sorted({old_pond_id, new_pond_id})
    locked_ponds = (
        db.query(models.Pond)
        .filter(models.Pond.id.in_(pond_ids))
        .order_by(models.Pond.id)
        .with_for_update()
        .all()
    )
    pond_map = {pond.id: pond for pond in locked_ponds}

    old_pond = pond_map.get(old_pond_id)
    new_pond = pond_map.get(new_pond_id)

    if new_pond is None:
        raise HTTPException(
            status_code=404,
            detail="Hovuz tapılmadı",
        )

    if record.stock_deducted and old_pond is not None:
        old_pond.fish_count += old_dead_count

    if new_dead_count > new_pond.fish_count:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=(
                f"Ölüm sayı hovuzdakı balıq sayından çox ola bilməz. "
                f"Mövcud balıq sayı: {new_pond.fish_count}"
            ),
        )

    new_pond.fish_count -= new_dead_count

    for field, value in updates.items():
        setattr(record, field, value)

    record.stock_deducted = True

    db.commit()
    db.refresh(record)

    return record


@app.delete(
    "/mortality/{record_id}",
    dependencies=[Depends(get_current_user)],
)
def delete_mortality_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.MortalityRecord)
        .filter(models.MortalityRecord.id == record_id)
        .with_for_update()
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Ölüm qeydi tapılmadı",
        )

    photo_paths = [item.photo_path for item in record.photos]
    if record.photo_path and record.photo_path not in photo_paths:
        photo_paths.append(record.photo_path)

    if record.stock_deducted:
        pond = (
            db.query(models.Pond)
            .filter(models.Pond.id == record.pond_id)
            .with_for_update()
            .first()
        )
        if pond is not None:
            pond.fish_count += record.dead_count

    db.delete(record)
    db.commit()

    for photo_path in photo_paths:
        photo_filename = Path(photo_path).name
        (MORTALITY_UPLOAD_DIR / photo_filename).unlink(missing_ok=True)

    return {
        "message": "Ölüm qeydi uğurla silindi"
    }

# ==================== GROWTH RECORDS ====================

from math import log


@app.post(
    "/growth",
    response_model=schemas.GrowthResponse,
    dependencies=[Depends(get_current_user)],
)
def create_growth_record(
    payload: schemas.GrowthCreate,
    db: Session = Depends(get_db),
):
    pond = (
        db.query(models.Pond)
        .filter(models.Pond.id == payload.pond_id)
        .first()
    )

    if pond is None:
        raise HTTPException(
            status_code=404,
            detail="Hovuz tapılmadı",
        )

    existing = (
        db.query(models.GrowthRecord)
        .filter(
            models.GrowthRecord.pond_id == payload.pond_id,
            models.GrowthRecord.measurement_date
            == payload.measurement_date,
        )
        .first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="Bu tarix üçün ölçü artıq mövcuddur",
        )

    record = models.GrowthRecord(**payload.model_dump())
    db.add(record)

    pond.fish_count = payload.fish_count
    pond.average_weight_g = payload.average_weight_g

    db.commit()
    db.refresh(record)

    return record


@app.put(
    "/growth/{record_id}",
    response_model=schemas.GrowthResponse,
    dependencies=[Depends(get_current_user)],
)
def update_growth_record(
    record_id: int,
    payload: schemas.GrowthUpdate,
    db: Session = Depends(get_db),
):
    record = (
        db.query(models.GrowthRecord)
        .filter(models.GrowthRecord.id == record_id)
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Artım qeydi tapılmadı",
        )

    update_data = payload.model_dump(exclude_unset=True)
    new_date = update_data.get(
        "measurement_date",
        record.measurement_date,
    )

    duplicate = (
        db.query(models.GrowthRecord)
        .filter(
            models.GrowthRecord.pond_id == record.pond_id,
            models.GrowthRecord.measurement_date == new_date,
            models.GrowthRecord.id != record.id,
        )
        .first()
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=400,
            detail="Bu tarix üçün ölçü artıq mövcuddur",
        )

    for field, value in update_data.items():
        setattr(record, field, value)

    db.flush()

    latest_record = (
        db.query(models.GrowthRecord)
        .filter(models.GrowthRecord.pond_id == record.pond_id)
        .order_by(
            models.GrowthRecord.measurement_date.desc(),
            models.GrowthRecord.id.desc(),
        )
        .first()
    )
    pond = (
        db.query(models.Pond)
        .filter(models.Pond.id == record.pond_id)
        .first()
    )

    if pond is not None and latest_record is not None:
        pond.fish_count = latest_record.fish_count
        pond.average_weight_g = latest_record.average_weight_g

    db.commit()
    db.refresh(record)

    return record


@app.get(
    "/growth",
    response_model=list[schemas.GrowthResponse],
    dependencies=[Depends(get_current_user)],
)
def list_growth_records(
    pond_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.GrowthRecord)

    if pond_id is not None:
        query = query.filter(
            models.GrowthRecord.pond_id == pond_id
        )

    return (
        query.order_by(
            models.GrowthRecord.measurement_date.desc(),
            models.GrowthRecord.id.desc(),
        )
        .all()
    )


@app.get(
    "/growth/calculations",
    response_model=list[schemas.GrowthCalculation],
    dependencies=[Depends(get_current_user)],
)
def calculate_growth_records(
    pond_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.GrowthRecord)

    if pond_id is not None:
        query = query.filter(
            models.GrowthRecord.pond_id == pond_id
        )

    records = (
        query.order_by(
            models.GrowthRecord.pond_id.asc(),
            models.GrowthRecord.measurement_date.asc(),
            models.GrowthRecord.id.asc(),
        )
        .all()
    )

    results = []
    previous_by_pond = {}

    for record in records:
        previous = previous_by_pond.get(record.pond_id)

        current_biomass = (
            record.fish_count
            * record.average_weight_g
            / 1000
        )

        calculation = {
            "record_id": record.id,
            "pond_id": record.pond_id,
            "measurement_date": record.measurement_date,
            "previous_date": None,
            "previous_weight_g": None,
            "current_weight_g": record.average_weight_g,
            "days_between": None,
            "weight_gain_g": None,
            "daily_weight_gain_g": None,
            "growth_percent": None,
            "sgr_percent_day": None,
            "previous_biomass_kg": None,
            "current_biomass_kg": round(current_biomass, 4),
            "biomass_gain_kg": None,
            "feed_used_kg": record.feed_used_kg,
            "fcr": None,
        }

        if previous is not None:
            days = (
                record.measurement_date
                - previous.measurement_date
            ).days

            weight_gain = (
                record.average_weight_g
                - previous.average_weight_g
            )

            previous_biomass = (
                previous.fish_count
                * previous.average_weight_g
                / 1000
            )

            biomass_gain = (
                current_biomass
                - previous_biomass
            )

            calculation["previous_date"] = (
                previous.measurement_date
            )
            calculation["previous_weight_g"] = round(
                previous.average_weight_g,
                4,
            )
            calculation["days_between"] = days
            calculation["weight_gain_g"] = round(
                weight_gain,
                4,
            )
            calculation["previous_biomass_kg"] = round(
                previous_biomass,
                4,
            )
            calculation["biomass_gain_kg"] = round(
                biomass_gain,
                4,
            )

            if days > 0:
                calculation["daily_weight_gain_g"] = round(
                    weight_gain / days,
                    4,
                )

                if previous.average_weight_g > 0:
                    calculation["growth_percent"] = round(
                        weight_gain
                        / previous.average_weight_g
                        * 100,
                        4,
                    )

                    calculation["sgr_percent_day"] = round(
                        (
                            log(record.average_weight_g)
                            - log(previous.average_weight_g)
                        )
                        / days
                        * 100,
                        4,
                    )

            if biomass_gain > 0:
                calculation["fcr"] = round(
                    record.feed_used_kg / biomass_gain,
                    4,
                )

        results.append(calculation)
        previous_by_pond[record.pond_id] = record

    return results


# ==================== FEED WAREHOUSE ====================
@app.get("/feed-warehouse/products", response_model=list[schemas.FeedProductResponse], dependencies=[Depends(get_current_user)])
def list_feed_products(db: Session = Depends(get_db)):
    return db.query(models.FeedProduct).order_by(models.FeedProduct.brand, models.FeedProduct.product_name).all()


@app.post("/feed-warehouse/products", response_model=schemas.FeedProductResponse, dependencies=[Depends(get_current_user)])
def create_feed_product(payload: schemas.FeedProductCreate, db: Session = Depends(get_db)):
    product = models.FeedProduct(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.put("/feed-warehouse/products/{product_id}", response_model=schemas.FeedProductResponse, dependencies=[Depends(get_current_user)])
def update_feed_product(product_id: int, payload: schemas.FeedProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.FeedProduct).filter(models.FeedProduct.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Yem məhsulu tapılmadı")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@app.delete("/feed-warehouse/products/{product_id}", dependencies=[Depends(get_current_user)])
def delete_feed_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.FeedProduct).filter(models.FeedProduct.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Yem məhsulu tapılmadı")
    db.query(models.FeedStockTransaction).filter(models.FeedStockTransaction.product_id == product_id).delete()
    db.delete(product)
    db.commit()
    return {"message": "Yem məhsulu silindi"}


@app.get("/feed-warehouse/transactions", response_model=list[schemas.FeedTransactionResponse], dependencies=[Depends(get_current_user)])
def list_feed_transactions(db: Session = Depends(get_db)):
    return db.query(models.FeedStockTransaction).order_by(models.FeedStockTransaction.transaction_date.desc(), models.FeedStockTransaction.id.desc()).all()


def _feed_stock_delta(transaction_type: str, quantity_kg: float) -> float:
    if transaction_type == "Giriş":
        return quantity_kg
    if transaction_type == "Çıxış":
        return -quantity_kg
    raise HTTPException(status_code=400, detail="Əməliyyat tipi Giriş və ya Çıxış olmalıdır")


@app.post("/feed-warehouse/transactions", response_model=schemas.FeedTransactionResponse, dependencies=[Depends(get_current_user)])
def create_feed_transaction(payload: schemas.FeedTransactionCreate, db: Session = Depends(get_db)):
    product = db.query(models.FeedProduct).filter(models.FeedProduct.id == payload.product_id).with_for_update().first()
    if product is None:
        raise HTTPException(status_code=404, detail="Yem məhsulu tapılmadı")
    delta = _feed_stock_delta(payload.transaction_type, payload.quantity_kg)
    if product.current_stock_kg + delta < 0:
        raise HTTPException(status_code=400, detail="Anbarda kifayət qədər yem yoxdur")
    transaction = models.FeedStockTransaction(**payload.model_dump())
    product.current_stock_kg += delta
    if payload.transaction_type == "Giriş" and payload.unit_price is not None:
        product.unit_price = payload.unit_price
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@app.put("/feed-warehouse/transactions/{transaction_id}", response_model=schemas.FeedTransactionResponse, dependencies=[Depends(get_current_user)])
def update_feed_transaction(transaction_id: int, payload: schemas.FeedTransactionUpdate, db: Session = Depends(get_db)):
    transaction = db.query(models.FeedStockTransaction).filter(models.FeedStockTransaction.id == transaction_id).with_for_update().first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Anbar əməliyyatı tapılmadı")
    product = db.query(models.FeedProduct).filter(models.FeedProduct.id == transaction.product_id).with_for_update().first()
    restored_stock = product.current_stock_kg - _feed_stock_delta(transaction.transaction_type, transaction.quantity_kg)
    update_data = payload.model_dump(exclude_unset=True)
    new_type = update_data.get("transaction_type", transaction.transaction_type)
    new_quantity = update_data.get("quantity_kg", transaction.quantity_kg)
    new_stock = restored_stock + _feed_stock_delta(new_type, new_quantity)
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Anbarda kifayət qədər yem yoxdur")
    for field, value in update_data.items():
        setattr(transaction, field, value)
    product.current_stock_kg = new_stock
    if new_type == "Giriş" and transaction.unit_price is not None:
        product.unit_price = transaction.unit_price
    db.commit()
    db.refresh(transaction)
    return transaction


@app.delete("/feed-warehouse/transactions/{transaction_id}", dependencies=[Depends(get_current_user)])
def delete_feed_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(models.FeedStockTransaction).filter(models.FeedStockTransaction.id == transaction_id).with_for_update().first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Anbar əməliyyatı tapılmadı")
    product = db.query(models.FeedProduct).filter(models.FeedProduct.id == transaction.product_id).with_for_update().first()
    new_stock = product.current_stock_kg - _feed_stock_delta(transaction.transaction_type, transaction.quantity_kg)
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Bu giriş silinsə stok mənfi olacaq; əvvəl sonrakı çıxışları düzəldin")
    product.current_stock_kg = new_stock
    db.delete(transaction)
    db.commit()
    return {"message": "Anbar əməliyyatı silindi"}


@app.post("/feed-warehouse/transactions/{transaction_id}/document", response_model=schemas.FeedTransactionResponse, dependencies=[Depends(get_current_user)])
async def upload_feed_transaction_document(
    transaction_id: int,
    document: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    transaction = db.query(models.FeedStockTransaction).filter(models.FeedStockTransaction.id == transaction_id).first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Anbar əməliyyatı tapılmadı")

    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    extension = allowed_types.get(document.content_type)
    if extension is None:
        raise HTTPException(status_code=400, detail="Yalnız JPG, PNG və WEBP şəkli qəbul edilir")

    content = await document.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Qaimə şəkli maksimum 10 MB ola bilər")

    document_dir = UPLOAD_ROOT / "feed_documents"
    document_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (document_dir / filename).write_bytes(content)

    if transaction.document_path:
        old_file = document_dir / Path(transaction.document_path).name
        old_file.unlink(missing_ok=True)

    transaction.document_path = f"/uploads/feed_documents/{filename}"
    db.commit()
    db.refresh(transaction)
    return transaction


# ==================== BROODSTOCK ====================
@app.get("/broodstock", response_model=list[schemas.BroodstockResponse], dependencies=[Depends(get_current_user)])
def list_broodstock(db: Session = Depends(get_db)):
    return db.query(models.BroodstockFish).order_by(models.BroodstockFish.chip_number).all()

@app.post("/broodstock", response_model=schemas.BroodstockResponse, dependencies=[Depends(get_current_user)])
def create_broodstock(payload: schemas.BroodstockCreate, db: Session = Depends(get_db)):
    if db.query(models.BroodstockFish).filter(models.BroodstockFish.chip_number == payload.chip_number).first():
        raise HTTPException(status_code=400, detail="Bu çip nömrəsi artıq mövcuddur")
    fish = models.BroodstockFish(**payload.model_dump())
    db.add(fish); db.commit(); db.refresh(fish)
    return fish

@app.put("/broodstock/{fish_id}", response_model=schemas.BroodstockResponse, dependencies=[Depends(get_current_user)])
def update_broodstock(fish_id: int, payload: schemas.BroodstockUpdate, db: Session = Depends(get_db)):
    fish = db.query(models.BroodstockFish).filter(models.BroodstockFish.id == fish_id).first()
    if fish is None: raise HTTPException(status_code=404, detail="Damazlıq balıq tapılmadı")
    data = payload.model_dump(exclude_unset=True)
    if "chip_number" in data and db.query(models.BroodstockFish).filter(models.BroodstockFish.chip_number == data["chip_number"], models.BroodstockFish.id != fish_id).first():
        raise HTTPException(status_code=400, detail="Bu çip nömrəsi artıq mövcuddur")
    for field, value in data.items(): setattr(fish, field, value)
    db.commit(); db.refresh(fish)
    return fish

@app.delete("/broodstock/{fish_id}", dependencies=[Depends(get_current_user)])
def delete_broodstock(fish_id: int, db: Session = Depends(get_db)):
    fish = db.query(models.BroodstockFish).filter(models.BroodstockFish.id == fish_id).first()
    if fish is None: raise HTTPException(status_code=404, detail="Damazlıq balıq tapılmadı")
    db.query(models.BroodstockUseRecord).filter(models.BroodstockUseRecord.broodstock_id == fish_id).delete()
    db.query(models.PolarizationRecord).filter(models.PolarizationRecord.broodstock_id == fish_id).delete()
    db.delete(fish); db.commit()
    return {"message": "Damazlıq balıq silindi"}

@app.post("/broodstock/{fish_id}/photo", response_model=schemas.BroodstockResponse, dependencies=[Depends(get_current_user)])
async def upload_broodstock_photo(fish_id: int, photo: UploadFile = File(...), db: Session = Depends(get_db)):
    fish = db.query(models.BroodstockFish).filter(models.BroodstockFish.id == fish_id).first()
    if fish is None: raise HTTPException(status_code=404, detail="Damazlıq balıq tapılmadı")
    allowed = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    extension = allowed.get(photo.content_type)
    if extension is None: raise HTTPException(status_code=400, detail="Yalnız JPG, PNG və WEBP qəbul edilir")
    content = await photo.read()
    if len(content) > 10 * 1024 * 1024: raise HTTPException(status_code=400, detail="Şəkil maksimum 10 MB ola bilər")
    directory = UPLOAD_ROOT / "broodstock"; directory.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"; (directory / filename).write_bytes(content)
    if fish.photo_path: (directory / Path(fish.photo_path).name).unlink(missing_ok=True)
    fish.photo_path = f"/uploads/broodstock/{filename}"
    db.commit(); db.refresh(fish)
    return fish

@app.get("/broodstock/{fish_id}/uses", response_model=list[schemas.BroodstockUseResponse], dependencies=[Depends(get_current_user)])
def list_broodstock_uses(fish_id: int, db: Session = Depends(get_db)):
    return db.query(models.BroodstockUseRecord).filter(models.BroodstockUseRecord.broodstock_id == fish_id).order_by(models.BroodstockUseRecord.use_date.desc()).all()

@app.post("/broodstock/{fish_id}/uses", response_model=schemas.BroodstockUseResponse, dependencies=[Depends(get_current_user)])
def create_broodstock_use(fish_id: int, payload: schemas.BroodstockUseCreate, db: Session = Depends(get_db)):
    if not db.query(models.BroodstockFish).filter(models.BroodstockFish.id == fish_id).first(): raise HTTPException(status_code=404, detail="Damazlıq balıq tapılmadı")
    record = models.BroodstockUseRecord(broodstock_id=fish_id, **payload.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return record

@app.delete("/broodstock/uses/{record_id}", dependencies=[Depends(get_current_user)])
def delete_broodstock_use(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.BroodstockUseRecord).filter(models.BroodstockUseRecord.id == record_id).first()
    if record is None: raise HTTPException(status_code=404, detail="İstifadə qeydi tapılmadı")
    db.delete(record); db.commit(); return {"message": "İstifadə qeydi silindi"}

@app.get("/broodstock/{fish_id}/polarizations", response_model=list[schemas.PolarizationResponse], dependencies=[Depends(get_current_user)])
def list_polarizations(fish_id: int, db: Session = Depends(get_db)):
    return db.query(models.PolarizationRecord).filter(models.PolarizationRecord.broodstock_id == fish_id).order_by(models.PolarizationRecord.measurement_date.desc()).all()

@app.post("/broodstock/{fish_id}/polarizations", response_model=schemas.PolarizationResponse, dependencies=[Depends(get_current_user)])
def create_polarization(fish_id: int, payload: schemas.PolarizationCreate, db: Session = Depends(get_db)):
    if not db.query(models.BroodstockFish).filter(models.BroodstockFish.id == fish_id).first(): raise HTTPException(status_code=404, detail="Damazlıq balıq tapılmadı")
    record = models.PolarizationRecord(broodstock_id=fish_id, **payload.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return record

@app.delete("/broodstock/polarizations/{record_id}", dependencies=[Depends(get_current_user)])
def delete_polarization(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.PolarizationRecord).filter(models.PolarizationRecord.id == record_id).first()
    if record is None: raise HTTPException(status_code=404, detail="Polarizasiya qeydi tapılmadı")
    db.delete(record); db.commit(); return {"message": "Polarizasiya qeydi silindi"}

# ==================== DRUG WAREHOUSE ====================
def _drug_delta(transaction_type: str, quantity: float) -> float:
    if transaction_type == "Giriş": return quantity
    if transaction_type == "Çıxış": return -quantity
    raise HTTPException(status_code=400, detail="Əməliyyat növü Giriş və ya Çıxış olmalıdır")

@app.get("/drug-warehouse/products", response_model=list[schemas.DrugProductResponse], dependencies=[Depends(get_current_user)])
def list_drug_products(db: Session = Depends(get_db)):
    return db.query(models.DrugProduct).order_by(models.DrugProduct.name).all()

@app.post("/drug-warehouse/products", response_model=schemas.DrugProductResponse, dependencies=[Depends(get_current_user)])
def create_drug_product(payload: schemas.DrugProductCreate, db: Session = Depends(get_db)):
    product = models.DrugProduct(**payload.model_dump())
    db.add(product); db.commit(); db.refresh(product)
    return product

@app.put("/drug-warehouse/products/{product_id}", response_model=schemas.DrugProductResponse, dependencies=[Depends(get_current_user)])
def update_drug_product(product_id: int, payload: schemas.DrugProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.DrugProduct).filter(models.DrugProduct.id == product_id).first()
    if product is None: raise HTTPException(status_code=404, detail="Dərman tapılmadı")
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(product, field, value)
    db.commit(); db.refresh(product)
    return product

@app.delete("/drug-warehouse/products/{product_id}", dependencies=[Depends(get_current_user)])
def delete_drug_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.DrugProduct).filter(models.DrugProduct.id == product_id).first()
    if product is None: raise HTTPException(status_code=404, detail="Dərman tapılmadı")
    if db.query(models.DrugStockTransaction).filter(models.DrugStockTransaction.product_id == product_id).first():
        raise HTTPException(status_code=400, detail="Bu dərmanın əməliyyat tarixçəsi var; əvvəlcə tarixçəni silin")
    db.delete(product); db.commit(); return {"message": "Dərman silindi"}

@app.get("/drug-warehouse/transactions", response_model=list[schemas.DrugTransactionResponse], dependencies=[Depends(get_current_user)])
def list_drug_transactions(db: Session = Depends(get_db)):
    return db.query(models.DrugStockTransaction).order_by(models.DrugStockTransaction.transaction_date.desc(), models.DrugStockTransaction.id.desc()).all()

@app.post("/drug-warehouse/transactions", response_model=schemas.DrugTransactionResponse, dependencies=[Depends(get_current_user)])
def create_drug_transaction(payload: schemas.DrugTransactionCreate, db: Session = Depends(get_db)):
    product = db.query(models.DrugProduct).filter(models.DrugProduct.id == payload.product_id).with_for_update().first()
    if product is None: raise HTTPException(status_code=404, detail="Dərman tapılmadı")
    new_stock = product.current_stock + _drug_delta(payload.transaction_type, payload.quantity)
    if new_stock < 0: raise HTTPException(status_code=400, detail="Anbarda kifayət qədər qalıq yoxdur")
    product.current_stock = new_stock
    if payload.unit_price is not None and payload.transaction_type == "Giriş": product.unit_price = payload.unit_price
    transaction = models.DrugStockTransaction(**payload.model_dump())
    db.add(transaction); db.commit(); db.refresh(transaction)
    return transaction

@app.put("/drug-warehouse/transactions/{transaction_id}", response_model=schemas.DrugTransactionResponse, dependencies=[Depends(get_current_user)])
def update_drug_transaction(transaction_id: int, payload: schemas.DrugTransactionUpdate, db: Session = Depends(get_db)):
    transaction = db.query(models.DrugStockTransaction).filter(models.DrugStockTransaction.id == transaction_id).with_for_update().first()
    if transaction is None: raise HTTPException(status_code=404, detail="Əməliyyat tapılmadı")
    product = db.query(models.DrugProduct).filter(models.DrugProduct.id == transaction.product_id).with_for_update().first()
    data = payload.model_dump(exclude_unset=True)
    new_type = data.get("transaction_type", transaction.transaction_type)
    new_quantity = data.get("quantity", transaction.quantity)
    restored_stock = product.current_stock - _drug_delta(transaction.transaction_type, transaction.quantity)
    new_stock = restored_stock + _drug_delta(new_type, new_quantity)
    if new_stock < 0: raise HTTPException(status_code=400, detail="Bu dəyişiklik üçün anbarda kifayət qədər qalıq yoxdur")
    product.current_stock = new_stock
    for field, value in data.items(): setattr(transaction, field, value)
    if transaction.unit_price is not None and transaction.transaction_type == "Giriş": product.unit_price = transaction.unit_price
    db.commit(); db.refresh(transaction)
    return transaction

@app.delete("/drug-warehouse/transactions/{transaction_id}", dependencies=[Depends(get_current_user)])
def delete_drug_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(models.DrugStockTransaction).filter(models.DrugStockTransaction.id == transaction_id).with_for_update().first()
    if transaction is None: raise HTTPException(status_code=404, detail="Əməliyyat tapılmadı")
    product = db.query(models.DrugProduct).filter(models.DrugProduct.id == transaction.product_id).with_for_update().first()
    new_stock = product.current_stock - _drug_delta(transaction.transaction_type, transaction.quantity)
    if new_stock < 0: raise HTTPException(status_code=400, detail="Bu giriş qeydini silmək olmaz: stok artıq istifadə edilib")
    product.current_stock = new_stock
    if transaction.document_path:
        (UPLOAD_ROOT / "drug_invoices" / Path(transaction.document_path).name).unlink(missing_ok=True)
    db.delete(transaction); db.commit(); return {"message": "Əməliyyat silindi"}

@app.post("/drug-warehouse/transactions/{transaction_id}/document", response_model=schemas.DrugTransactionResponse, dependencies=[Depends(get_current_user)])
async def upload_drug_document(transaction_id: int, photo: UploadFile = File(...), db: Session = Depends(get_db)):
    transaction = db.query(models.DrugStockTransaction).filter(models.DrugStockTransaction.id == transaction_id).first()
    if transaction is None: raise HTTPException(status_code=404, detail="Əməliyyat tapılmadı")
    extension = PHOTO_EXTENSIONS.get(photo.content_type)
    if extension is None: raise HTTPException(status_code=400, detail="Yalnız JPG, PNG və WEBP qəbul edilir")
    content = await photo.read()
    if len(content) > MAX_PHOTO_SIZE: raise HTTPException(status_code=400, detail="Şəkil maksimum 10 MB ola bilər")
    directory = UPLOAD_ROOT / "drug_invoices"; directory.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"; (directory / filename).write_bytes(content)
    if transaction.document_path: (directory / Path(transaction.document_path).name).unlink(missing_ok=True)
    transaction.document_path = f"/uploads/drug_invoices/{filename}"
    db.commit(); db.refresh(transaction)
    return transaction

# ==================== COLD STORAGE ====================
@app.get("/cold-storage", response_model=list[schemas.ColdStorageResponse], dependencies=[Depends(get_current_user)])
def list_cold_storage(db: Session = Depends(get_db)):
    return db.query(models.ColdStorageBatch).order_by(models.ColdStorageBatch.received_date.desc(), models.ColdStorageBatch.id.desc()).all()

@app.post("/cold-storage", response_model=schemas.ColdStorageResponse, dependencies=[Depends(get_current_user)])
def create_cold_storage(payload: schemas.ColdStorageCreate, db: Session = Depends(get_db)):
    data=payload.model_dump(); count=data.pop("fish_count"); weight=data.pop("weight_kg")
    batch=models.ColdStorageBatch(**data, initial_fish_count=count, current_fish_count=count, initial_weight_kg=weight, current_weight_kg=weight)
    db.add(batch); db.commit(); db.refresh(batch); return batch

@app.put("/cold-storage/{batch_id}", response_model=schemas.ColdStorageResponse, dependencies=[Depends(get_current_user)])
def update_cold_storage(batch_id:int,payload:schemas.ColdStorageUpdate,db:Session=Depends(get_db)):
    batch=db.query(models.ColdStorageBatch).filter(models.ColdStorageBatch.id==batch_id).first()
    if batch is None: raise HTTPException(status_code=404,detail="Soyuducu partiyası tapılmadı")
    for k,v in payload.model_dump(exclude_unset=True).items(): setattr(batch,k,v)
    db.commit(); db.refresh(batch); return batch

@app.delete("/cold-storage/{batch_id}", dependencies=[Depends(get_current_user)])
def delete_cold_storage(batch_id:int,db:Session=Depends(get_db)):
    batch=db.query(models.ColdStorageBatch).filter(models.ColdStorageBatch.id==batch_id).first()
    if batch is None: raise HTTPException(status_code=404,detail="Soyuducu partiyası tapılmadı")
    if batch.current_fish_count!=batch.initial_fish_count or abs(batch.current_weight_kg-batch.initial_weight_kg)>0.0001:
        raise HTTPException(status_code=400,detail="Bu partiyadan satış edilib; partiyanı silmək olmaz")
    db.delete(batch); db.commit(); return {"message":"Soyuducu partiyası silindi"}

def _restore_sale_stock(sale,db):
    if not sale.stock_deducted:return
    if sale.source_type=="Soyuducu" and sale.cold_storage_batch_id:
        b=db.query(models.ColdStorageBatch).filter(models.ColdStorageBatch.id==sale.cold_storage_batch_id).with_for_update().first()
        if b: b.current_fish_count+=sale.fish_count; b.current_weight_kg+=sale.total_weight_kg
    elif sale.pond_id:
        p=db.query(models.Pond).filter(models.Pond.id==sale.pond_id).with_for_update().first()
        if p:p.fish_count+=sale.fish_count

def _deduct_sale_stock(source_type,pond_id,cold_id,count,weight,db):
    if source_type=="Soyuducu":
        b=db.query(models.ColdStorageBatch).filter(models.ColdStorageBatch.id==cold_id).with_for_update().first()
        if b is None:raise HTTPException(status_code=404,detail="Soyuducu partiyası tapılmadı")
        if b.current_fish_count<count or b.current_weight_kg+0.0001<weight:raise HTTPException(status_code=400,detail=f"Soyuducuda yalnız {b.current_fish_count} ədəd / {b.current_weight_kg:.3f} kq qalıb")
        b.current_fish_count-=count;b.current_weight_kg-=weight
    else:
        p=db.query(models.Pond).filter(models.Pond.id==pond_id).with_for_update().first()
        if p is None:raise HTTPException(status_code=404,detail="Hovuz tapılmadı")
        if p.fish_count<count:raise HTTPException(status_code=400,detail=f"Hovuzda yalnız {p.fish_count} balıq var")
        p.fish_count-=count

# ==================== SALES ====================
@app.get("/sales",response_model=list[schemas.SaleResponse],dependencies=[Depends(get_current_user)])
def list_sales(db:Session=Depends(get_db)):
    return db.query(models.SaleRecord).order_by(models.SaleRecord.sale_date.desc(),models.SaleRecord.id.desc()).all()

@app.post("/sales",response_model=schemas.SaleResponse,dependencies=[Depends(get_current_user)])
def create_sale(payload:schemas.SaleCreate,db:Session=Depends(get_db)):
    _deduct_sale_stock(payload.source_type,payload.pond_id,payload.cold_storage_batch_id,payload.fish_count,payload.total_weight_kg,db)
    sale=models.SaleRecord(**payload.model_dump(),total_amount=round(payload.total_weight_kg*payload.price_per_kg,2),stock_deducted=True)
    db.add(sale);db.commit();db.refresh(sale);return sale

@app.put("/sales/{sale_id}",response_model=schemas.SaleResponse,dependencies=[Depends(get_current_user)])
def update_sale(sale_id:int,payload:schemas.SaleUpdate,db:Session=Depends(get_db)):
    sale=db.query(models.SaleRecord).filter(models.SaleRecord.id==sale_id).with_for_update().first()
    if sale is None:raise HTTPException(status_code=404,detail="Satış tapılmadı")
    data=payload.model_dump(exclude_unset=True);_restore_sale_stock(sale,db)
    source=data.get("source_type",sale.source_type);pond=data.get("pond_id",sale.pond_id);cold=data.get("cold_storage_batch_id",sale.cold_storage_batch_id);count=data.get("fish_count",sale.fish_count);weight=data.get("total_weight_kg",sale.total_weight_kg)
    _deduct_sale_stock(source,pond,cold,count,weight,db)
    for k,v in data.items():setattr(sale,k,v)
    sale.total_amount=round(sale.total_weight_kg*sale.price_per_kg,2);db.commit();db.refresh(sale);return sale

@app.delete("/sales/{sale_id}",dependencies=[Depends(get_current_user)])
def delete_sale(sale_id:int,db:Session=Depends(get_db)):
    sale=db.query(models.SaleRecord).filter(models.SaleRecord.id==sale_id).with_for_update().first()
    if sale is None:raise HTTPException(status_code=404,detail="Satış tapılmadı")
    _restore_sale_stock(sale,db)
    if sale.document_path:(UPLOAD_ROOT/"sales_invoices"/Path(sale.document_path).name).unlink(missing_ok=True)
    db.delete(sale);db.commit();return {"message":"Satış silindi və stok geri qaytarıldı"}

@app.post("/sales/{sale_id}/document",response_model=schemas.SaleResponse,dependencies=[Depends(get_current_user)])
async def upload_sale_document(sale_id:int,photo:UploadFile=File(...),db:Session=Depends(get_db)):
    sale=db.query(models.SaleRecord).filter(models.SaleRecord.id==sale_id).first()
    if sale is None:raise HTTPException(status_code=404,detail="Satış tapılmadı")
    ext=PHOTO_EXTENSIONS.get(photo.content_type)
    if ext is None:raise HTTPException(status_code=400,detail="Yalnız JPG, PNG və WEBP qəbul edilir")
    content=await photo.read()
    if len(content)>MAX_PHOTO_SIZE:raise HTTPException(status_code=400,detail="Şəkil maksimum 10 MB ola bilər")
    directory=UPLOAD_ROOT/"sales_invoices";directory.mkdir(parents=True,exist_ok=True);filename=f"{uuid4().hex}{ext}";(directory/filename).write_bytes(content)
    if sale.document_path:(directory/Path(sale.document_path).name).unlink(missing_ok=True)
    sale.document_path=f"/uploads/sales_invoices/{filename}";db.commit();db.refresh(sale);return sale

# ==================== PERSONNEL ====================
@app.get("/employees",response_model=list[schemas.EmployeeResponse],dependencies=[Depends(get_current_user)])
def list_employees(db:Session=Depends(get_db)):
    return db.query(models.Employee).order_by(models.Employee.full_name).all()

@app.post("/employees",response_model=schemas.EmployeeResponse,dependencies=[Depends(get_current_user)])
def create_employee(payload:schemas.EmployeeCreate,db:Session=Depends(get_db)):
    if db.query(models.Employee).filter(models.Employee.employee_code==payload.employee_code).first():raise HTTPException(status_code=400,detail="Bu işçi kodu artıq mövcuddur")
    if payload.fin_code and db.query(models.Employee).filter(models.Employee.fin_code==payload.fin_code).first():raise HTTPException(status_code=400,detail="Bu FIN kodu artıq mövcuddur")
    obj=models.Employee(**payload.model_dump());db.add(obj);db.commit();db.refresh(obj);return obj

@app.put("/employees/{employee_id}",response_model=schemas.EmployeeResponse,dependencies=[Depends(get_current_user)])
def update_employee(employee_id:int,payload:schemas.EmployeeUpdate,db:Session=Depends(get_db)):
    obj=db.query(models.Employee).filter(models.Employee.id==employee_id).first()
    if obj is None:raise HTTPException(status_code=404,detail="İşçi tapılmadı")
    data=payload.model_dump(exclude_unset=True)
    if "employee_code" in data and db.query(models.Employee).filter(models.Employee.employee_code==data["employee_code"],models.Employee.id!=employee_id).first():raise HTTPException(status_code=400,detail="Bu işçi kodu artıq mövcuddur")
    if data.get("fin_code") and db.query(models.Employee).filter(models.Employee.fin_code==data["fin_code"],models.Employee.id!=employee_id).first():raise HTTPException(status_code=400,detail="Bu FIN kodu artıq mövcuddur")
    for k,v in data.items():setattr(obj,k,v)
    db.commit();db.refresh(obj);return obj

@app.delete("/employees/{employee_id}",dependencies=[Depends(get_current_user)])
def delete_employee(employee_id:int,db:Session=Depends(get_db)):
    obj=db.query(models.Employee).filter(models.Employee.id==employee_id).first()
    if obj is None:raise HTTPException(status_code=404,detail="İşçi tapılmadı")
    db.query(models.AttendanceRecord).filter(models.AttendanceRecord.employee_id==employee_id).delete()
    db.query(models.SalaryPayment).filter(models.SalaryPayment.employee_id==employee_id).delete()
    docs=db.query(models.EmployeeDocument).filter(models.EmployeeDocument.employee_id==employee_id).all()
    for d in docs:(UPLOAD_ROOT/"employees"/Path(d.document_path).name).unlink(missing_ok=True)
    db.query(models.EmployeeDocument).filter(models.EmployeeDocument.employee_id==employee_id).delete()
    if obj.photo_path:(UPLOAD_ROOT/"employees"/Path(obj.photo_path).name).unlink(missing_ok=True)
    db.delete(obj);db.commit();return {"message":"İşçi silindi"}

@app.post("/employees/{employee_id}/photo",response_model=schemas.EmployeeResponse,dependencies=[Depends(get_current_user)])
async def upload_employee_photo(employee_id:int,photo:UploadFile=File(...),db:Session=Depends(get_db)):
    obj=db.query(models.Employee).filter(models.Employee.id==employee_id).first()
    if obj is None:raise HTTPException(status_code=404,detail="İşçi tapılmadı")
    ext=PHOTO_EXTENSIONS.get(photo.content_type)
    if ext is None:raise HTTPException(status_code=400,detail="Yalnız JPG, PNG və WEBP qəbul edilir")
    content=await photo.read()
    if len(content)>MAX_PHOTO_SIZE:raise HTTPException(status_code=400,detail="Şəkil maksimum 10 MB ola bilər")
    directory=UPLOAD_ROOT/"employees";directory.mkdir(parents=True,exist_ok=True);name=f"{uuid4().hex}{ext}";(directory/name).write_bytes(content)
    if obj.photo_path:(directory/Path(obj.photo_path).name).unlink(missing_ok=True)
    obj.photo_path=f"/uploads/employees/{name}";db.commit();db.refresh(obj);return obj

@app.get("/employees/{employee_id}/attendance",response_model=list[schemas.AttendanceResponse],dependencies=[Depends(get_current_user)])
def list_attendance(employee_id:int,db:Session=Depends(get_db)):
    return db.query(models.AttendanceRecord).filter(models.AttendanceRecord.employee_id==employee_id).order_by(models.AttendanceRecord.attendance_date.desc()).all()
@app.post("/employees/{employee_id}/attendance",response_model=schemas.AttendanceResponse,dependencies=[Depends(get_current_user)])
def create_attendance(employee_id:int,payload:schemas.AttendanceCreate,db:Session=Depends(get_db)):
    old=db.query(models.AttendanceRecord).filter(models.AttendanceRecord.employee_id==employee_id,models.AttendanceRecord.attendance_date==payload.attendance_date).first()
    if old:
        for k,v in payload.model_dump().items():setattr(old,k,v)
        db.commit();db.refresh(old);return old
    obj=models.AttendanceRecord(employee_id=employee_id,**payload.model_dump());db.add(obj);db.commit();db.refresh(obj);return obj
@app.delete("/attendance/{record_id}",dependencies=[Depends(get_current_user)])
def delete_attendance(record_id:int,db:Session=Depends(get_db)):
    obj=db.query(models.AttendanceRecord).filter(models.AttendanceRecord.id==record_id).first()
    if obj is None:raise HTTPException(status_code=404,detail="Davamiyyət tapılmadı")
    db.delete(obj);db.commit();return {"message":"Davamiyyət silindi"}

@app.get("/employees/{employee_id}/salary-payments",response_model=list[schemas.SalaryPaymentResponse],dependencies=[Depends(get_current_user)])
def list_salary(employee_id:int,db:Session=Depends(get_db)):
    return db.query(models.SalaryPayment).filter(models.SalaryPayment.employee_id==employee_id).order_by(models.SalaryPayment.payment_date.desc()).all()
@app.post("/employees/{employee_id}/salary-payments",response_model=schemas.SalaryPaymentResponse,dependencies=[Depends(get_current_user)])
def create_salary(employee_id:int,payload:schemas.SalaryPaymentCreate,db:Session=Depends(get_db)):
    obj=models.SalaryPayment(employee_id=employee_id,**payload.model_dump());db.add(obj);db.commit();db.refresh(obj);return obj
@app.delete("/salary-payments/{payment_id}",dependencies=[Depends(get_current_user)])
def delete_salary(payment_id:int,db:Session=Depends(get_db)):
    obj=db.query(models.SalaryPayment).filter(models.SalaryPayment.id==payment_id).first()
    if obj is None:raise HTTPException(status_code=404,detail="Maaş ödənişi tapılmadı")
    db.delete(obj);db.commit();return {"message":"Ödəniş silindi"}

@app.get("/employees/{employee_id}/documents",response_model=list[schemas.EmployeeDocumentResponse],dependencies=[Depends(get_current_user)])
def list_employee_documents(employee_id:int,db:Session=Depends(get_db)):
    return db.query(models.EmployeeDocument).filter(models.EmployeeDocument.employee_id==employee_id).order_by(models.EmployeeDocument.created_at.desc()).all()
@app.post("/employees/{employee_id}/documents",response_model=schemas.EmployeeDocumentResponse,dependencies=[Depends(get_current_user)])
async def upload_employee_document(employee_id:int,document_type:str,notes:str|None=None,file:UploadFile=File(...),db:Session=Depends(get_db)):
    if not db.query(models.Employee).filter(models.Employee.id==employee_id).first():raise HTTPException(status_code=404,detail="İşçi tapılmadı")
    allowed={"image/jpeg":".jpg","image/png":".png","image/webp":".webp","application/pdf":".pdf"};ext=allowed.get(file.content_type)
    if ext is None:raise HTTPException(status_code=400,detail="Yalnız JPG, PNG, WEBP və PDF qəbul edilir")
    content=await file.read()
    if len(content)>15*1024*1024:raise HTTPException(status_code=400,detail="Sənəd maksimum 15 MB ola bilər")
    directory=UPLOAD_ROOT/"employees";directory.mkdir(parents=True,exist_ok=True);name=f"{uuid4().hex}{ext}";(directory/name).write_bytes(content)
    obj=models.EmployeeDocument(employee_id=employee_id,document_type=document_type,document_path=f"/uploads/employees/{name}",notes=notes);db.add(obj);db.commit();db.refresh(obj);return obj
@app.delete("/employee-documents/{document_id}",dependencies=[Depends(get_current_user)])
def delete_employee_document(document_id:int,db:Session=Depends(get_db)):
    obj=db.query(models.EmployeeDocument).filter(models.EmployeeDocument.id==document_id).first()
    if obj is None:raise HTTPException(status_code=404,detail="Sənəd tapılmadı")
    (UPLOAD_ROOT/"employees"/Path(obj.document_path).name).unlink(missing_ok=True);db.delete(obj);db.commit();return {"message":"Sənəd silindi"}


# ==================== FISH SPECIALIST ====================
@app.get("/fish-specialist/records", response_model=list[schemas.FishSpecialistResponse], dependencies=[Depends(get_current_user)])
def list_fish_specialist_records(record_type: str | None = None, pond_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.FishSpecialistRecord)
    if record_type:
        query = query.filter(models.FishSpecialistRecord.record_type == record_type)
    if pond_id is not None:
        query = query.filter(models.FishSpecialistRecord.pond_id == pond_id)
    return query.order_by(models.FishSpecialistRecord.record_date.desc(), models.FishSpecialistRecord.id.desc()).all()


@app.post("/fish-specialist/records", response_model=schemas.FishSpecialistResponse, dependencies=[Depends(get_current_user)])
def create_fish_specialist_record(payload: schemas.FishSpecialistCreate, db: Session = Depends(get_db)):
    if payload.pond_id is not None and not db.query(models.Pond).filter(models.Pond.id == payload.pond_id).first():
        raise HTTPException(status_code=404, detail="Hovuz, nohur və ya qəfəs tapılmadı")
    obj = models.FishSpecialistRecord(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/fish-specialist/records/{record_id}", response_model=schemas.FishSpecialistResponse, dependencies=[Depends(get_current_user)])
def update_fish_specialist_record(record_id: int, payload: schemas.FishSpecialistUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.FishSpecialistRecord).filter(models.FishSpecialistRecord.id == record_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="Balıqşünas qeydi tapılmadı")
    data = payload.model_dump(exclude_unset=True)
    if data.get("pond_id") is not None and not db.query(models.Pond).filter(models.Pond.id == data["pond_id"]).first():
        raise HTTPException(status_code=404, detail="Hovuz, nohur və ya qəfəs tapılmadı")
    for key, value in data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/fish-specialist/records/{record_id}", dependencies=[Depends(get_current_user)])
def delete_fish_specialist_record(record_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.FishSpecialistRecord).filter(models.FishSpecialistRecord.id == record_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="Balıqşünas qeydi tapılmadı")
    db.delete(obj)
    db.commit()
    return {"message": "Balıqşünas qeydi silindi"}


# ==================== TEMPERATURE STATISTICS ====================
@app.get("/temperature-records", response_model=list[schemas.TemperatureResponse], dependencies=[Depends(get_current_user)])
def list_temperature_records(db: Session = Depends(get_db)):
    return db.query(models.TemperatureRecord).order_by(models.TemperatureRecord.record_date.desc(), models.TemperatureRecord.id.desc()).all()


@app.post("/temperature-records", response_model=schemas.TemperatureResponse, dependencies=[Depends(get_current_user)])
def create_temperature_record(payload: schemas.TemperatureCreate, db: Session = Depends(get_db)):
    obj = models.TemperatureRecord(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/temperature-records/{record_id}", response_model=schemas.TemperatureResponse, dependencies=[Depends(get_current_user)])
def update_temperature_record(record_id: int, payload: schemas.TemperatureUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.TemperatureRecord).filter(models.TemperatureRecord.id == record_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="Temperatur qeydi tapılmadı")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/temperature-records/{record_id}", dependencies=[Depends(get_current_user)])
def delete_temperature_record(record_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.TemperatureRecord).filter(models.TemperatureRecord.id == record_id).first()
    if obj is None:
        raise HTTPException(status_code=404, detail="Temperatur qeydi tapılmadı")
    db.delete(obj)
    db.commit()
    return {"message": "Temperatur qeydi silindi"}
