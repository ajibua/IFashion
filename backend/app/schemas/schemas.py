from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict

class DesignerCreate(BaseModel):
    brand_name: str
    handle: str
    email: str
    password: str
    phone: str
    bio: Optional[str] = None
    location: Optional[str] = None
    delivery_options: Optional[List[str]] = ["pickup", "delivery"]
    instagram: Optional[str] = None


class DesignerLogin(BaseModel):
    email: str
    password: str


class DesignerUpdate(BaseModel):
    brand_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    delivery_options: Optional[List[str]] = None
    instagram: Optional[str] = None


class DesignerPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    handle: str
    brand_name: str
    phone: str
    bio: Optional[str] = None
    location: Optional[str] = None
    delivery_options: Optional[List[str]] = None
    instagram: Optional[str] = None


class DesignerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    handle: str
    brand_name: str
    email: str
    phone: str
    bio: Optional[str] = None
    location: Optional[str] = None
    delivery_options: Optional[List[str]] = None
    instagram: Optional[str] = None
    token: Optional[str] = None
    created_at: datetime


# ---------- Customer ----------


class CustomerBase(BaseModel):
    name: str
    phone: str
    measurements: Optional[Dict[str, Any]] = None


class CustomerCreate(CustomerBase):
    designer_id: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    measurements: Optional[Dict[str, Any]] = None


class Customer(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    designer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class OrderBase(BaseModel):
    style: Optional[str] = None
    color: Optional[str] = None
    occasion: Optional[str] = None
    deadline: Optional[str] = None
    notes: Optional[str] = None
    delivery_method: Optional[str] = "pickup"  # "pickup" | "delivery"
    delivery_address: Optional[str] = None


class OrderCreate(OrderBase):
    customer_id: str
    designer_id: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str  # received | cutting | stitching | ready | delivered


class Order(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    designer_id: Optional[str] = None
    customer_id: str
    status: str
    created_at: datetime
    customer: Optional[Customer] = None


class CustomerWithOrders(Customer):
    orders: List[Order] = []


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    phone: Optional[str] = None
    designer_handle: Optional[str] = None
    designer_id: Optional[str] = None
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    order_ready: bool = False
    extracted: Optional[Dict[str, Any]] = None
