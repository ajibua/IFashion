from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Order, Customer, Designer
from app.schemas import schemas
from app.notifications import notify_new_order

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    designer = None
    if order.designer_id:
        designer = db.query(Designer).filter(Designer.id == order.designer_id).first()

    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    notify_new_order(customer.name, customer.phone, order.model_dump(), designer=designer)
    return db_order


@router.get("/", response_model=list[schemas.Order])
def list_orders(
    designer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Order).options(joinedload(Order.customer)).order_by(Order.created_at.desc())
    if designer_id:
        query = query.filter(Order.designer_id == designer_id)
    if status:
        query = query.filter(Order.status == status)
    return query.all()


@router.get("/{order_id}", response_model=schemas.Order)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.customer)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=schemas.Order)
def update_order_status(order_id: str, update: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    valid_statuses = ("received", "measuring", "cutting", "stitching", "ready", "delivered")
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    order = db.query(Order).options(joinedload(Order.customer)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = update.status
    db.commit()
    db.refresh(order)
    return order
