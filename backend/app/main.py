from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, chat, customers, orders

# Automatically create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IFashion Multi-Tenant Atelier API", version="0.0.1")

import os

frontend_url = os.environ.get("FRONTEND_URL")
allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {
        "status": "IFashion Multi-Tenant API running",
        "features": ["designer-auth", "public-ateliers", "verified-ai-concierge", "cloud-notifications"],
    }
