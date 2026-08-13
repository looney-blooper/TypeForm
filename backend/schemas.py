"""
Pydantic schemas — request bodies and response shapes for the API.
Kept separate from SQLAlchemy models (app/models.py) so the DB layer
and the wire format can evolve independently.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from backend.models import FormStatus, QuestionType


# ---------------------------------------------------------------------------
# Question
# ---------------------------------------------------------------------------

class QuestionBase(BaseModel):
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool = False
    settings: dict[str, Any] = Field(default_factory=dict)
    logic: Optional[dict[str, Any]] = None


class QuestionCreate(QuestionBase):
    """Body for POST /forms/{id}/questions. order_index is assigned server-side (appended)."""
    pass


class QuestionUpdate(BaseModel):
    """Body for PATCH /questions/{id}. All fields optional (partial update)."""
    type: Optional[QuestionType] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required: Optional[bool] = None
    settings: Optional[dict[str, Any]] = None
    logic: Optional[dict[str, Any]] = None


class QuestionOut(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    order_index: int


class QuestionReorderItem(BaseModel):
    id: int
    order_index: int


class QuestionReorderRequest(BaseModel):
    """Body for PATCH /forms/{id}/questions/reorder — bulk order update after drag-drop."""
    order: list[QuestionReorderItem]
