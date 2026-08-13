"""
Results views for the creator: response list/detail and per-question
summary stats. All scoped to forms owned by the current (default) creator.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_creator
from .forms import _get_owned_form

router = APIRouter(prefix="/api/forms/{form_id}", tags=["responses"])


@router.get("/responses", response_model=list[schemas.ResponseListItem])
def list_responses(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    return [
        schemas.ResponseListItem(
            id=r.id,
            started_at=r.started_at,
            submitted_at=r.submitted_at,
            is_complete=r.submitted_at is not None,
        )
        for r in sorted(form.responses, key=lambda r: r.started_at, reverse=True)
    ]


@router.get("/responses/{response_id}", response_model=schemas.ResponseOut)
def get_response(
    form_id: int,
    response_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    response = next((r for r in form.responses if r.id == response_id), None)
    if response is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Response not found")
    return response


def _summarize_question(question: models.Question, answers: list[models.Answer]) -> dict:
    values = [a.value for a in answers]

    if question.type in (models.QuestionType.multiple_choice, models.QuestionType.dropdown):
        labels_by_id = {c["id"]: c["label"] for c in question.settings.get("choices", [])}
        counts: dict[str, int] = {label: 0 for label in labels_by_id.values()}
        for v in values:
            # v is a list for multi-select, a single id string otherwise — normalize to a list
            chosen = v if isinstance(v, list) else [v]
            for choice_id in chosen:
                label = labels_by_id.get(choice_id, choice_id)
                counts[label] = counts.get(label, 0) + 1
        return counts

    if question.type in (models.QuestionType.number, models.QuestionType.rating):
        nums = [v for v in values if isinstance(v, (int, float))]
        if not nums:
            return {"average": None, "min": None, "max": None}
        return {"average": sum(nums) / len(nums), "min": min(nums), "max": max(nums)}

    if question.type == models.QuestionType.yes_no:
        return {"yes": sum(1 for v in values if v is True), "no": sum(1 for v in values if v is False)}

    # short_text / long_text / email: no numeric summary, just a response count
    return {}


@router.get("/stats", response_model=schemas.FormStatsOut)
def get_form_stats(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)

    total_responses = len(form.responses)
    completed = [r for r in form.responses if r.submitted_at is not None]
    completion_rate = (len(completed) / total_responses) if total_responses else 0.0

    # Only count completed responses' answers toward per-question stats,
    # so partial/abandoned fills don't skew the summary.
    answers_by_question: dict[int, list[models.Answer]] = {q.id: [] for q in form.questions}
    for r in completed:
        for a in r.answers:
            answers_by_question.setdefault(a.question_id, []).append(a)

    question_stats = [
        schemas.QuestionStat(
            question_id=q.id,
            question_title=q.title,
            type=q.type,
            response_count=len(answers_by_question.get(q.id, [])),
            summary=_summarize_question(q, answers_by_question.get(q.id, [])),
        )
        for q in form.questions
    ]

    return schemas.FormStatsOut(
        form_id=form.id,
        total_responses=total_responses,
        completed_responses=len(completed),
        completion_rate=round(completion_rate, 4),
        questions=question_stats,
    )
