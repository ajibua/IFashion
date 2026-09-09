import hashlib
import os
import re
import secrets
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.database import get_db
from app.models.models import Designer
from app.schemas import schemas

router = APIRouter(prefix="/auth", tags=["auth"])


def validate_password_strength(password: str) -> None:
    """Enforces: length >= 8, letters, numbers, and special symbols."""
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long.",
        )
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one letter.",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one number.",
        )
    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one symbol (e.g. !@#$%^&*).",
        )


def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"{salt}${key.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    if "$" not in hashed:
        return False
    salt, _ = hashed.split("$", 1)
    return hash_password(password, salt) == hashed


from app.auth_jwt import create_access_token, decode_access_token

def get_current_designer(
    authorization: Optional[str] = Header(None),
    x_designer_token: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Designer:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1].strip()
    elif x_designer_token:
        token = x_designer_token.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Designer authentication required",
        )

    # 1. Primary: Verify signed JWT
    payload = decode_access_token(token)
    designer = None
    if payload and "sub" in payload:
        designer = db.query(Designer).filter(Designer.id == payload["sub"]).first()

    # 2. Fallback: Legacy token lookup for existing sessions
    if not designer:
        designer = db.query(Designer).filter(Designer.token == token).first()

    if not designer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session",
        )
    return designer


@router.post("/register", response_model=schemas.DesignerResponse)
def register(data: schemas.DesignerCreate, db: Session = Depends(get_db)):
    # Validate password strength: letters, numbers, symbols, length >= 8
    validate_password_strength(data.password)

    # Clean handle (lowercase alphanumeric and hyphens)
    handle = data.handle.strip().lower().replace(" ", "-").replace("@", "")
    email = data.email.strip().lower()

    if db.query(Designer).filter(Designer.handle == handle).first():
        raise HTTPException(status_code=400, detail="This designer handle is already taken. Please choose another.")

    if db.query(Designer).filter(Designer.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    from app.models.models import gen_uuid
    designer_id = gen_uuid()
    token = create_access_token(
        subject=designer_id,
        extra_claims={"email": email, "handle": handle, "brand_name": data.brand_name.strip()},
    )

    designer = Designer(
        id=designer_id,
        brand_name=data.brand_name.strip(),
        handle=handle,
        email=email,
        password_hash=hash_password(data.password),
        phone=data.phone.strip(),
        bio=data.bio,
        location=data.location,
        delivery_options=data.delivery_options or ["pickup", "delivery"],
        instagram=data.instagram,
        token=token,
    )
    db.add(designer)
    db.commit()
    db.refresh(designer)
    return designer


@router.post("/login", response_model=schemas.DesignerResponse)
def login(data: schemas.DesignerLogin, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    designer = db.query(Designer).filter(Designer.email == email).first()

    if not designer or not verify_password(data.password, designer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Generate signed JWT token
    token = create_access_token(
        subject=designer.id,
        extra_claims={"email": designer.email, "handle": designer.handle, "brand_name": designer.brand_name},
    )
    designer.token = token
    db.commit()
    db.refresh(designer)
    return designer


@router.get("/me", response_model=schemas.DesignerResponse)
def get_me(current_designer: Designer = Depends(get_current_designer)):
    return current_designer


@router.patch("/profile", response_model=schemas.DesignerResponse)
def update_profile(
    data: schemas.DesignerUpdate,
    current_designer: Designer = Depends(get_current_designer),
    db: Session = Depends(get_db),
):
    if data.brand_name is not None:
        current_designer.brand_name = data.brand_name.strip()
    if data.phone is not None:
        current_designer.phone = data.phone.strip()
    if data.bio is not None:
        current_designer.bio = data.bio
    if data.location is not None:
        current_designer.location = data.location
    if data.delivery_options is not None:
        current_designer.delivery_options = data.delivery_options
    if data.instagram is not None:
        current_designer.instagram = data.instagram
    if data.portfolio is not None:
        current_designer.portfolio = data.portfolio

    db.commit()
    db.refresh(current_designer)
    return current_designer


@router.post("/portfolio", response_model=schemas.DesignerResponse)
def add_portfolio_item(
    item: schemas.PortfolioItemCreate,
    current_designer: Designer = Depends(get_current_designer),
    db: Session = Depends(get_db),
):
    """Add a tailor's custom design/style to their shop catalog."""
    current_portfolio = list(current_designer.portfolio or [])
    new_item = {
        "id": secrets.token_hex(8),
        "title": item.title.strip(),
        "tag": item.tag.strip() if item.tag else "All Styles",
        "desc": item.desc.strip() if item.desc else "",
        "image": item.image.strip(),
    }
    current_portfolio.insert(0, new_item)
    current_designer.portfolio = current_portfolio
    flag_modified(current_designer, "portfolio")
    db.commit()
    db.refresh(current_designer)
    return current_designer


@router.delete("/portfolio/{item_id}", response_model=schemas.DesignerResponse)
def delete_portfolio_item(
    item_id: str,
    current_designer: Designer = Depends(get_current_designer),
    db: Session = Depends(get_db),
):
    """Remove a custom design/style from the tailor's shop catalog."""
    current_portfolio = list(current_designer.portfolio or [])
    filtered = [p for p in current_portfolio if p.get("id") != item_id]
    current_designer.portfolio = filtered
    flag_modified(current_designer, "portfolio")
    db.commit()
    db.refresh(current_designer)
    return current_designer


@router.get("/designers", response_model=List[schemas.DesignerPublic])
def list_designers(db: Session = Depends(get_db)):
    """Public directory of designers on IFashion."""
    return db.query(Designer).order_by(Designer.created_at.desc()).all()


@router.get("/designer/{handle}", response_model=schemas.DesignerPublic)
def get_public_designer(handle: str, db: Session = Depends(get_db)):
    clean_handle = handle.strip().lower().replace("@", "")
    designer = db.query(Designer).filter(Designer.handle == clean_handle).first()
    if not designer:
        raise HTTPException(status_code=404, detail="Designer profile not found")
    return designer
