from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Order, Customer, Designer
from app.schemas import schemas
from app.notifications import notify_new_order, notify_order_status_update

router = APIRouter(prefix="/orders", tags=["orders"])


from app.auth_jwt import decode_access_token

def get_optional_designer(
    authorization: Optional[str] = Header(None),
    x_designer_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[Designer]:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
    elif x_designer_token:
        token = x_designer_token.strip()

    if not token:
        return None

    payload = decode_access_token(token)
    if payload and "sub" in payload:
        designer = db.query(Designer).filter(Designer.id == payload["sub"]).first()
        if designer:
            return designer

    return db.query(Designer).filter(Designer.token == token).first()


@router.post("/", response_model=schemas.Order)
def create_order(
    order: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
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

    # Ensure measurements from customer record are included in notification payload
    order_dict = order.model_dump()
    if customer.measurements and not order_dict.get("measurements"):
        order_dict["measurements"] = customer.measurements

    # Dispatch notifications asynchronously
    background_tasks.add_task(
        notify_new_order,
        customer_name=customer.name,
        phone=customer.phone,
        order=order_dict,
        designer_name=designer.brand_name if designer else None,
        designer_phone=designer.phone if designer else None,
        designer_email=designer.email if designer else None,
    )
    return db_order


@router.get("/", response_model=list[schemas.Order])
def list_orders(
    designer_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_designer: Optional[Designer] = Depends(get_optional_designer),
    db: Session = Depends(get_db),
):
    query = db.query(Order).options(joinedload(Order.customer)).order_by(Order.created_at.desc())

    # Auto-scope to authenticated designer if designer_id is not explicitly passed
    effective_designer_id = designer_id or (current_designer.id if current_designer else None)
    if effective_designer_id:
        query = query.filter(Order.designer_id == effective_designer_id)

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
def update_order_status(
    order_id: str,
    update: schemas.OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    valid_statuses = ("received", "measuring", "cutting", "stitching", "ready", "delivered")
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    order = db.query(Order).options(joinedload(Order.customer), joinedload(Order.designer)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    order.status = update.status
    db.commit()
    db.refresh(order)

    # If status actually changed and customer has a phone, notify them asynchronously
    if old_status != update.status and order.customer and order.customer.phone:
        background_tasks.add_task(
            notify_order_status_update,
            customer_name=order.customer.name,
            customer_phone=order.customer.phone,
            order_style=order.style or "Custom Native Outfit",
            new_status=update.status,
            designer_name=order.designer.brand_name if order.designer else None,
            delivery_method=order.delivery_method or "pickup",
            delivery_address=order.delivery_address,
        )

    return order
