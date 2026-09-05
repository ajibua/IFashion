from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.models import Customer
from app.schemas import schemas

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == customer.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this phone already exists")
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("/search", response_model=list[schemas.Customer])
def search_customers(
    q: str = Query(..., min_length=1),
    designer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Search customers by name or phone — used by the designer measurement book."""
    query = db.query(Customer).filter(or_(Customer.name.ilike(f"%{q}%"), Customer.phone.ilike(f"%{q}%")))
    if designer_id:
        query = query.filter(or_(Customer.designer_id == designer_id, Customer.designer_id.is_(None)))
    return query.all()


@router.get("/by-phone/{phone}", response_model=schemas.CustomerWithOrders)
def get_customer_by_phone(phone: str, db: Session = Depends(get_db)):
    """Used by the AI chat to recall a returning customer's saved measurements."""
    customer = db.query(Customer).filter(Customer.phone == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/{customer_id}", response_model=schemas.CustomerWithOrders)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: str, update: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/", response_model=list[schemas.Customer])
def list_customers(
    designer_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Customer).order_by(Customer.created_at.desc())
    if designer_id:
        query = query.filter(or_(Customer.designer_id == designer_id, Customer.designer_id.is_(None)))
    return query.all()
