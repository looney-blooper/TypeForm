"""
Simplified 'auth'. Per assignment scope, real creator authentication is
mocked — every builder/management request acts as the single default
creator, seeded lazily on first use. This module is the single seam where
real auth (e.g. JWT/session lookup) would plug in later without touching
the routers that depend on `get_current_creator`.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from . import models
from .database import get_db

DEFAULT_CREATOR_EMAIL = "creator@example.com"


def get_current_creator(db: Session = Depends(get_db)) -> models.Creator:
    creator = db.query(models.Creator).filter_by(email=DEFAULT_CREATOR_EMAIL).first()
    if creator is None:
        creator = models.Creator(name="Default Creator", email=DEFAULT_CREATOR_EMAIL)
        db.add(creator)
        db.commit()
        db.refresh(creator)
    return creator
