"""
Database setup for IFashion.

Supports:
  - Supabase / PostgreSQL (Production): when DATABASE_URL is set in environment.
  - SQLite (Local Development): fallback when DATABASE_URL is not set.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

raw_db_url = os.environ.get("DATABASE_URL", "sqlite:///./ifashion.db")

if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = raw_db_url
if "sqlite" in db_url:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=300,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
