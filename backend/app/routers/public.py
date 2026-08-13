"""
Public respondent flow. No authentication — anyone with a published
form's slug can start a response, save answers as they go, and submit.
Draft forms are never resolvable here (404), so an unpublished form's
slug leaking doesn't expose its content.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..schemas import validate_answer_value

router = APIRouter(prefix="/api/public", tags=["public"])


def _get_published_form(db: Session, slug: str) -> models.Form:
    form = (
        db.query(models.Form)
        .filter(models.Form.slug == slug, models.Form.status == models.FormStatus.published)
        .first()
    )
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


def _get_response(db: Session, response_id: int) -> models.Response:
    response = db.query(models.Response).filter(models.Response.id == response_id).first()
    if response is None:
        raise HTTPException(status_code=404, detail="Response not found")
    return response


def _upsert_answers(db: Session, response: models.Response, answers: list[schemas.AnswerSubmit]) -> None:
    """Validate each answer against its question, then insert or update in place."""
    question_by_id = {q.id: q for q in response.form.questions}

    for a in answers:
        question = question_by_id.get(a.question_id)
        if question is None:
            raise HTTPException(
                status_code=400, detail=f"Question {a.question_id} does not belong to this form"
            )
        try:
            value = validate_answer_value(question, a.value)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        existing = (
            db.query(models.Answer)
            .filter(
                models.Answer.response_id == response.id,
                models.Answer.question_id == a.question_id,
            )
            .first()
        )
        if existing:
            existing.value = value
        else:
            db.add(models.Answer(response_id=response.id, question_id=a.question_id, value=value))


@router.get("/forms/{slug}", response_model=schemas.PublicFormOut)
def get_public_form(slug: str, db: Session = Depends(get_db)):
    return _get_published_form(db, slug)


@router.post("/forms/{slug}/responses", response_model=schemas.ResponseStartOut, status_code=201)
def start_response(slug: str, db: Session = Depends(get_db)):
    """
    Called once, when the respondent begins filling the form (e.g. on
    the welcome screen or first answer). Enables partial-response tracking:
    a Response row exists with submitted_at=None until they finish.
    """
    form = _get_published_form(db, slug)
    response = models.Response(form_id=form.id)
    db.add(response)
    db.commit()
    db.refresh(response)
    return schemas.ResponseStartOut(response_id=response.id, started_at=response.started_at)


@router.patch("/responses/{response_id}/answers", status_code=204)
def save_answers(
    response_id: int,
    body: schemas.AnswerUpsertRequest,
    db: Session = Depends(get_db),
):
    """Save-as-you-go: called after each question in the respondent flow."""
    response = _get_response(db, response_id)
    if response.submitted_at is not None:
        raise HTTPException(status_code=400, detail="This response has already been submitted")
    _upsert_answers(db, response, body.answers)
    db.commit()
    return None


@router.post("/responses/{response_id}/submit", response_model=schemas.ResponseOut)
def submit_response(
    response_id: int,
    body: schemas.SubmitResponseRequest,
    db: Session = Depends(get_db),
):
    response = _get_response(db, response_id)
    if response.submitted_at is not None:
        raise HTTPException(status_code=400, detail="This response has already been submitted")

    if body.answers:
        _upsert_answers(db, response, body.answers)
        db.flush()

    # Server-side required-field check across ALL of the form's questions,
    # not just what was in this request — catches anything the client skipped.
    # Query fresh rather than trusting response.answers, since newly added
    # Answer rows in this request were attached via db.add(), not via the
    # relationship, so the cached collection may not reflect them yet.
    answered_ids = {
        row[0]
        for row in db.query(models.Answer.question_id)
        .filter(models.Answer.response_id == response.id)
        .all()
    }
    missing = [
        q.title for q in response.form.questions
        if q.required and q.id not in answered_ids
    ]
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required answers: {', '.join(missing)}",
        )

    response.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(response)
    return response
