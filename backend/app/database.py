"""
Database engine & session setup for the Typeform clone.
Uses SQLite for simplicity (per assignment spec).
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Defaults to a local file for `uvicorn app.main:app` during development.
# In Docker, DATABASE_PATH points at a volume-mounted directory so the
# SQLite file survives container restarts/recreates.
DATABASE_PATH = os.environ.get("DATABASE_PATH", "./app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# check_same_thread=False is required for SQLite when used with FastAPI's
# threaded request handling.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
