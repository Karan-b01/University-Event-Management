from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Engine creation with PostgreSQL support and fallback for local development/testing
DATABASE_URL = settings.DATABASE_URL
connect_args = {}

try:
    if DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
    else:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        # Verify connection early to catch missing database, driver, or auth failure
        with engine.connect() as conn:
            pass
except Exception as e:
    # Graceful fallback to SQLite for local standalone development/testing
    print(f"[Database Setup Notice] PostgreSQL connection unavailable ({e}). Falling back to local SQLite DB.")
    DATABASE_URL = "sqlite:///./event_system.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session
    and guarantees proper closure after request processing.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
