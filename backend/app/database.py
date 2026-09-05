"""
Database setup for IFashion.

Supports:
  - Supabase / PostgreSQL (Production): when DATABASE_URL is set in environment.
  - SQLite (Local Development): fallback when DATABASE_URL is not set.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Read connection string from environment (e.g. Supabase connection string)
raw_db_url = os.environ.get("DATABASE_URL", "sqlite:///./ifashion.db")

# Supabase / cloud providers often use "postgres://", which SQLAlchemy 1.4+ requires as "postgresql://"
if raw_db_url.startswith("postgres://"):
    db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    db_url = raw_db_url

# Configure engine parameters based on database dialect
if "sqlite" in db_url:
    # check_same_thread=False is needed only for SQLite
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    # PostgreSQL / Supabase pooler configuration (serverless friendly)
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
