"""
SQLAlchemy ORM models.

Schema:
  creators (1) --- (many) forms (1) --- (many) questions
  forms (1) --- (many) responses (1) --- (many) answers --- (1) questions
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid() -> str:
    return uuid.uuid4().hex


class FormStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    closed = "closed"


class QuestionType(str, enum.Enum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"


class Creator(Base):
    __tablename__ = "creators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)

    forms = relationship("Form", back_populates="creator", cascade="all, delete-orphan")


class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("creators.id"), nullable=False)

    title = Column(String, nullable=False, default="Untitled Form")
    description = Column(Text, nullable=True)
    status = Column(Enum(FormStatus), nullable=False, default=FormStatus.draft)

    # Unique public slug, only meaningful once published, but generated
    # up-front so the share link is stable even if the creator toggles
    # publish/unpublish repeatedly.
    slug = Column(String, unique=True, index=True, default=gen_uuid)

    # Bonus: custom themes -> {"primaryColor": "#000", "font": "...", "background": "..."}
    theme = Column(JSON, nullable=False, default=dict)

    # Settings placeholder (thank-you screen text, redirect url, etc.)
    thank_you_message = Column(String, nullable=True, default="Thanks for completing this form!")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("Creator", back_populates="forms")
    questions = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.order_index",
    )
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)

    type = Column(Enum(QuestionType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)  # help text shown under the title

    order_index = Column(Integer, nullable=False, default=0)
    required = Column(Boolean, nullable=False, default=False)

    # Type-specific config, e.g.:
    #   multiple_choice/dropdown -> {"choices": [{"id": "a", "label": "Red"}, ...], "allowMultiple": false}
    #   rating                   -> {"max": 5, "shape": "star"}
    #   number                   -> {"min": 0, "max": 100}
    settings = Column(JSON, nullable=False, default=dict)

    # Placeholder for the logic-jump bonus feature:
    #   {"rules": [{"if": {"choiceId": "a"}, "goto": <question_id>}]}
    logic = Column(JSON, nullable=True)

    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)

    started_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)  # null = incomplete / partial response

    respondent_meta = Column(JSON, nullable=True)  # optional, non-identifying (e.g. user agent)

    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"
    __table_args__ = (
        UniqueConstraint("response_id", "question_id", name="uq_answer_per_question"),
    )

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("responses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    # Normalized value, shape depends on question type:
    #   short_text/long_text/email -> string
    #   number/rating              -> number
    #   yes_no                     -> bool
    #   multiple_choice/dropdown   -> string or list of choice ids
    value = Column(JSON, nullable=False)

    response = relationship("Response", back_populates="answers")
    question = relationship("Question", back_populates="answers")
