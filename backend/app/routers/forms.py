"""
Form management (creator-side): CRUD, publish/unpublish, duplicate.
All routes act as the single default creator (see app/deps.py).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_creator

router = APIRouter(prefix="/api/forms", tags=["forms"])


def _get_owned_form(db: Session, form_id: int, creator: models.Creator) -> models.Form:
    form = (
        db.query(models.Form)
        .filter(models.Form.id == form_id, models.Form.creator_id == creator.id)
        .first()
    )
    if form is None:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.get("", response_model=list[schemas.FormListItem])
def list_forms(
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    rows = (
        db.query(models.Form, func.count(models.Response.id).label("response_count"))
        .outerjoin(models.Response, models.Response.form_id == models.Form.id)
        .filter(models.Form.creator_id == creator.id)
        .group_by(models.Form.id)
        .order_by(models.Form.updated_at.desc())
        .all()
    )
    out = []
    for form, response_count in rows:
        item = schemas.FormListItem.model_validate(form)
        item.response_count = response_count
        item.cover_image_url = (form.theme or {}).get("thumbnailUrl")
        out.append(item)
    return out


@router.post("", response_model=schemas.FormOut, status_code=201)
def create_form(
    body: schemas.FormCreate,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = models.Form(creator_id=creator.id, title=body.title, description=body.description)
    db.add(form)
    db.commit()
    db.refresh(form)
    return form


@router.get("/{form_id}", response_model=schemas.FormOut)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    return _get_owned_form(db, form_id, creator)


@router.patch("/{form_id}", response_model=schemas.FormOut)
def update_form(
    form_id: int,
    body: schemas.FormUpdate,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(form, field, value)
    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204)
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    db.delete(form)
    db.commit()
    return None


@router.post("/{form_id}/duplicate", response_model=schemas.FormOut, status_code=201)
def duplicate_form(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    original = _get_owned_form(db, form_id, creator)

    copy = models.Form(
        creator_id=creator.id,
        title=f"{original.title} (Copy)",
        description=original.description,
        status=models.FormStatus.draft,  # duplicates always start as draft
        theme=dict(original.theme or {}),
        thank_you_message=original.thank_you_message,
    )
    db.add(copy)
    db.flush()  # assign copy.id without committing yet

    for q in original.questions:
        db.add(
            models.Question(
                form_id=copy.id,
                type=q.type,
                title=q.title,
                description=q.description,
                order_index=q.order_index,
                required=q.required,
                settings=dict(q.settings or {}),
                logic=dict(q.logic) if q.logic else None,
            )
        )

    db.commit()
    db.refresh(copy)
    return copy


@router.post("/{form_id}/publish", response_model=schemas.FormOut)
def publish_form(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    if not form.questions:
        raise HTTPException(status_code=400, detail="Cannot publish a form with no questions")
    form.status = models.FormStatus.published
    db.commit()
    db.refresh(form)
    return form


@router.post("/{form_id}/unpublish", response_model=schemas.FormOut)
def unpublish_form(
    form_id: int,
    db: Session = Depends(get_db),
    creator: models.Creator = Depends(get_current_creator),
):
    form = _get_owned_form(db, form_id, creator)
    form.status = models.FormStatus.draft
    db.commit()
    db.refresh(form)
    return form
