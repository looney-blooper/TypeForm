"""
Question management, nested under a form. Ownership is always checked
via the parent form's creator_id (see _get_owned_form / _get_owned_question)
so a creator can't edit or reorder another creator's questions.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_creator
from .forms import _get_owned_form

router = APIRouter(tags=["questions"])


def _get_owned_question(db: Session, question_id: int, creator: models.Creator) -> models.Question:
    question = (
        db.query(models.Question)
        .join(models.Form)
        .filter(models.Question.id == question_id, models.Form.creator_id == creator.id)
        .first()
    )
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/api/forms/{form_id}/questions", response_model=schemas.QuestionOut, status_code=201)
def add_question(
    form_id: int,
    body: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    next_index = len(form.questions)  # append to the end

    question = models.Question(
        form_id=form.id,
        type=body.type,
        title=body.title,
        description=body.description,
        required=body.required,
        settings=body.settings,
        logic=body.logic,
        order_index=next_index,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.patch("/api/questions/{question_id}", response_model=schemas.QuestionOut)
def update_question(
    question_id: int,
    body: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    question = _get_owned_question(db, question_id, creator)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question


@router.delete("/api/questions/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    question = _get_owned_question(db, question_id, creator)
    form_id = question.form_id
    db.delete(question)
    db.flush()

    # Re-pack order_index so there are no gaps after deletion.
    remaining = (
        db.query(models.Question)
        .filter(models.Question.form_id == form_id)
        .order_by(models.Question.order_index)
        .all()
    )
    for i, q in enumerate(remaining):
        q.order_index = i

    db.commit()
    return None


@router.patch("/api/forms/{form_id}/questions/reorder", response_model=list[schemas.QuestionOut])
def reorder_questions(
    form_id: int,
    body: schemas.QuestionReorderRequest,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    valid_ids = {q.id for q in form.questions}

    incoming_ids = {item.id for item in body.order}
    if incoming_ids != valid_ids:
        raise HTTPException(
            status_code=400,
            detail="Reorder payload must include exactly the form's current question ids",
        )

    by_id = {q.id: q for q in form.questions}
    for item in body.order:
        by_id[item.id].order_index = item.order_index

    db.commit()
    return sorted(form.questions, key=lambda q: q.order_index)
