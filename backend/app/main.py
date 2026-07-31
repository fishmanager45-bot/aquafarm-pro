from datetime import date
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import extract, func
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
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

app = FastAPI(
    title="AquaFarm Pro",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        .first()
    )

    if pond is None:
        raise HTTPException(
            status_code=404,
            detail="Hovuz tapılmadı",
        )

    new_record = models.MortalityRecord(
        **mortality.model_dump()
    )

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

    if "pond_id" in updates:
        pond = (
            db.query(models.Pond)
            .filter(models.Pond.id == updates["pond_id"])
            .first()
        )

        if pond is None:
            raise HTTPException(
                status_code=404,
                detail="Hovuz tapılmadı",
            )

    for field, value in updates.items():
        setattr(record, field, value)

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
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Ölüm qeydi tapılmadı",
        )

    db.delete(record)
    db.commit()

    return {
        "message": "Ölüm qeydi uğurla silindi"
    }