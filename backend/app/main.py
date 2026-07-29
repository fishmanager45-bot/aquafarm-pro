from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AquaFarm Pro",
    version="1.0.0",
)


@app.get("/")
def home():
    return {
        "message": "AquaFarm Pro işləyir!",
        "status": "OK",
        "database": "Connected",
    }


@app.post("/ponds", response_model=schemas.PondResponse)
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


@app.get("/ponds", response_model=list[schemas.PondResponse])
def list_ponds(db: Session = Depends(get_db)):
    return db.query(models.Pond).order_by(models.Pond.id).all()
@app.get("/ponds/{pond_id}", response_model=schemas.PondResponse)
def get_pond(
    pond_id: int,
    db: Session = Depends(get_db),
):
    pond = db.query(models.Pond).filter(models.Pond.id == pond_id).first()

    if not pond:
        raise HTTPException(status_code=404, detail="Hovuz tapılmadı")

    return pond


@app.put("/ponds/{pond_id}", response_model=schemas.PondResponse)
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
