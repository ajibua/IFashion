from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.models import Customer, Order
from app.schemas import schemas

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """Create a new client record or upsert measurements if phone already exists."""
    clean_phone = customer.phone.strip()
    existing = db.query(Customer).filter(Customer.phone == clean_phone).first()

    if existing:
        if customer.name:
            existing.name = customer.name.strip()
        if customer.measurements:
            merged = dict(existing.measurements or {})
            merged.update(customer.measurements)
            existing.measurements = merged
        if customer.designer_id and not existing.designer_id:
            existing.designer_id = customer.designer_id
        db.commit()
        db.refresh(existing)
        return existing

    db_customer = Customer(
        name=customer.name.strip(),
        phone=clean_phone,
        designer_id=customer.designer_id,
        measurements=customer.measurements or {},
    )
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
    """Search customers by name or phone — used by the tailor measurement book."""
    query = db.query(Customer).filter(or_(Customer.name.ilike(f"%{q}%"), Customer.phone.ilike(f"%{q}%")))
    if designer_id:
        # Include clients directly registered to this tailor OR who have placed orders with this tailor
        query = query.filter(
            or_(
                Customer.designer_id == designer_id,
                Customer.orders.any(Order.designer_id == designer_id),
                Customer.designer_id.is_(None),
            )
        )
    return query.all()


@router.get("/by-phone/{phone}", response_model=schemas.CustomerWithOrders)
def get_customer_by_phone(phone: str, db: Session = Depends(get_db)):
    """Used by the AI chat to recall a returning customer's saved measurements."""
    clean_phone = phone.strip()
    customer = db.query(Customer).filter(Customer.phone == clean_phone).first()
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
    """List all customers for a tailor's measurement book."""
    query = db.query(Customer).order_by(Customer.created_at.desc())
    if designer_id:
        # Include clients directly registered to this tailor OR who have placed orders with this tailor
        query = query.filter(
            or_(
                Customer.designer_id == designer_id,
                Customer.orders.any(Order.designer_id == designer_id),
            )
        )
    return query.all()
