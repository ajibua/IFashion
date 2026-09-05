import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Designer(Base):
    __tablename__ = "designers"

    id = Column(String, primary_key=True, default=gen_uuid)
    handle = Column(String, unique=True, nullable=False, index=True)  # e.g. "marvelous" -> ifashion.ng/@marvelous
    brand_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    phone = Column(String, nullable=False)  # WhatsApp number for orders
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)  # City / Physical atelier address
    delivery_options = Column(JSON, default=lambda: ["pickup", "delivery"])  # pickup, delivery
    instagram = Column(String, nullable=True)
    token = Column(String, nullable=True, index=True)  # Session auth token
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    orders = relationship("Order", back_populates="designer", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="designer")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=gen_uuid)
    designer_id = Column(String, ForeignKey("designers.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    measurements = Column(JSON, nullable=True)  # e.g. {"chest": 40, "waist": 34, ...}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    designer = relationship("Designer", back_populates="customers")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=gen_uuid)
    designer_id = Column(String, ForeignKey("designers.id"), nullable=True, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    style = Column(String, nullable=True)
    color = Column(String, nullable=True)
    occasion = Column(String, nullable=True)
    deadline = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    delivery_method = Column(String, default="pickup")  # "pickup" (in-person walk-in) or "delivery" (driver dispatch)
    delivery_address = Column(String, nullable=True)  # Shipping address if delivery
    status = Column(String, default="received")  # received | cutting | stitching | ready | delivered
    created_at = Column(DateTime, default=datetime.utcnow)

    designer = relationship("Designer", back_populates="orders")
    customer = relationship("Customer", back_populates="orders")
