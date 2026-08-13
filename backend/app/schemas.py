"""
Pydantic schemas — request bodies and response shapes for the API.
Kept separate from SQLAlchemy models (app/models.py) so the DB layer
and the wire format can evolve independently.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from .models import FormStatus, QuestionType


# ---------------------------------------------------------------------------
# Question
# ---------------------------------------------------------------------------

class Choice(BaseModel):
    """One option for multiple_choice / dropdown questions."""
    id: str
    label: str


class QuestionBase(BaseModel):
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool = False
    # For multiple_choice: {"choices": [Choice, ...], "allowMultiple": bool}
    # For dropdown: {"choices": [Choice, ...]}  (always single-select)
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


# ---------------------------------------------------------------------------
# Form
# ---------------------------------------------------------------------------

class FormCreate(BaseModel):
    title: str = "Untitled Form"
    description: Optional[str] = None


class FormUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[dict[str, Any]] = None
    thank_you_message: Optional[str] = None


class FormListItem(BaseModel):
    """Row shape for the creator's dashboard list."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    status: FormStatus
    slug: str
    response_count: int = 0
    updated_at: datetime


class FormOut(BaseModel):
    """Full form detail, used by the builder."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    creator_id: int
    title: str
    description: Optional[str] = None
    status: FormStatus
    slug: str
    theme: dict[str, Any]
    thank_you_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    questions: list[QuestionOut] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Public respondent flow
# ---------------------------------------------------------------------------

class PublicQuestionOut(BaseModel):
    """Question shape exposed to respondents — no `logic` internals leaked beyond what's needed."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: QuestionType
    title: str
    description: Optional[str] = None
    required: bool
    settings: dict[str, Any]
    order_index: int


class PublicFormOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    theme: dict[str, Any]
    thank_you_message: Optional[str] = None
    questions: list[PublicQuestionOut]


class ResponseStartOut(BaseModel):
    """Returned when a respondent begins filling a form."""
    response_id: int
    started_at: datetime


class AnswerSubmit(BaseModel):
    question_id: int
    value: Any


def validate_answer_value(question: "models.Question", value: Any) -> Any:  # noqa: F821
    """
    Server-side answer validation, keyed off the question's type + settings.
    Called by the public router before persisting an Answer. Raises ValueError
    on invalid input; the router translates that into a 422.

    multiple_choice is the one type whose expected shape branches on settings:
      - allowMultiple=False (default): value must be a single choice id (str)
      - allowMultiple=True:            value must be a non-empty list[str] of choice ids,
                                        each id validated against settings["choices"]
    """
    from . import models  # local import to avoid circular import at module load

    qtype = question.type
    settings = question.settings or {}

    if question.required and (value is None or value == "" or value == []):
        raise ValueError(f"Question {question.id} is required")

    if value is None:
        return value  # optional + skipped

    if qtype == models.QuestionType.multiple_choice:
        choice_ids = {c["id"] for c in settings.get("choices", [])}
        allow_multiple = bool(settings.get("allowMultiple", False))
        if allow_multiple:
            if not isinstance(value, list):
                raise ValueError("Expected a list of choice ids for a multi-select question")
            if not set(value).issubset(choice_ids):
                raise ValueError("One or more choice ids are not valid options")
        else:
            if isinstance(value, list):
                raise ValueError("This question only allows a single choice")
            if value not in choice_ids:
                raise ValueError("Choice id is not a valid option")
    elif qtype == models.QuestionType.dropdown:
        choice_ids = {c["id"] for c in settings.get("choices", [])}
        if value not in choice_ids:
            raise ValueError("Choice id is not a valid option")
    elif qtype == models.QuestionType.email:
        if "@" not in str(value):
            raise ValueError("Invalid email format")
    elif qtype == models.QuestionType.number:
        if not isinstance(value, (int, float)):
            raise ValueError("Expected a number")
    elif qtype == models.QuestionType.rating:
        max_rating = settings.get("max", 5)
        if not isinstance(value, (int, float)) or not (0 <= value <= max_rating):
            raise ValueError(f"Rating must be between 0 and {max_rating}")
    elif qtype == models.QuestionType.yes_no:
        if not isinstance(value, bool):
            raise ValueError("Expected a boolean")

    return value


class AnswerUpsertRequest(BaseModel):
    """Body for PATCH /public/responses/{id}/answers — save-as-you-go."""
    answers: list[AnswerSubmit]


class SubmitResponseRequest(BaseModel):
    """Body for POST /public/responses/{id}/submit — final answers + mark complete."""
    answers: list[AnswerSubmit] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Results / stats
# ---------------------------------------------------------------------------

class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: int
    value: Any


class ResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    form_id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    answers: list[AnswerOut] = Field(default_factory=list)


class ResponseListItem(BaseModel):
    """Row shape for the results table (no full answers, just a summary)."""
    id: int
    started_at: datetime
    submitted_at: Optional[datetime] = None
    is_complete: bool


class QuestionStat(BaseModel):
    """Per-question aggregate for the results/summary view."""
    question_id: int
    question_title: str
    type: QuestionType
    response_count: int
    # For dropdown / single-select multiple_choice: {"choice_label": count, ...}
    # For multi-select multiple_choice (allowMultiple=true): still {"choice_label": count, ...},
    #   but counts are NOT mutually exclusive per response (one respondent can add to
    #   multiple buckets), so response_count != sum(summary.values()) in that case.
    # For number/rating: {"average": x, "min": x, "max": x}
    # For yes_no: {"yes": count, "no": count}
    summary: dict[str, Any]


class FormStatsOut(BaseModel):
    form_id: int
    total_responses: int
    completed_responses: int
    completion_rate: float
    questions: list[QuestionStat]
