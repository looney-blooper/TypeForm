"""
Seed the database with a default creator, a few published forms covering
all question types (including multi-select), and enough sample responses
that the dashboard, respondent flow, and results/stats pages are all
immediately usable on first run.

Usage:
    python -m app.seed            # seeds if empty
    python -m app.seed --reset    # drops all rows first, then reseeds
"""
import argparse
import random
from datetime import datetime, timedelta

from .database import Base, SessionLocal, engine
from .deps import DEFAULT_CREATOR_EMAIL
from . import models


def reset_db(db):
    # Delete in FK-safe order (children first).
    db.query(models.Answer).delete()
    db.query(models.Response).delete()
    db.query(models.Question).delete()
    db.query(models.Form).delete()
    db.query(models.Creator).delete()
    db.commit()


def get_or_create_creator(db) -> models.Creator:
    creator = db.query(models.Creator).filter_by(email=DEFAULT_CREATOR_EMAIL).first()
    if creator is None:
        creator = models.Creator(name="Default Creator", email=DEFAULT_CREATOR_EMAIL)
        db.add(creator)
        db.commit()
        db.refresh(creator)
    return creator


def add_question(db, form, order_index, **kwargs) -> models.Question:
    q = models.Question(form_id=form.id, order_index=order_index, **kwargs)
    db.add(q)
    db.flush()
    return q


def build_customer_feedback_form(db, creator) -> models.Form:
    form = models.Form(
        creator_id=creator.id,
        title="Customer Feedback",
        description="Tell us how we're doing.",
        status=models.FormStatus.published,
        theme={
            "font": "Inter",
            "roundedCorners": "small",
            "colors": {
                "question": "#191919",
                "answer": "#191919",
                "button": "#191919",
                "background": "#FFFFFF",
            },
            "background": {"layout": "none", "imageUrl": None, "brightness": 0},
        },
        thank_you_message="Thanks for the feedback — we read every response!",
    )
    db.add(form)
    db.flush()

    q_name = add_question(
        db, form, 0,
        type=models.QuestionType.short_text, title="What's your name?",
        description=None, required=True, settings={},
    )
    q_email = add_question(
        db, form, 1,
        type=models.QuestionType.email, title="What's your email?",
        description="In case we want to follow up.", required=True, settings={},
    )
    q_features = add_question(
        db, form, 2,
        type=models.QuestionType.multiple_choice, title="Which features do you use regularly?",
        description="Select all that apply.", required=True,
        settings={
            "choices": [
                {"id": "builder", "label": "Form Builder"},
                {"id": "analytics", "label": "Analytics"},
                {"id": "themes", "label": "Custom Themes"},
                {"id": "integrations", "label": "Integrations"},
            ],
            "allowMultiple": True,
        },
    )
    q_plan = add_question(
        db, form, 3,
        type=models.QuestionType.dropdown, title="Which plan are you on?",
        description=None, required=True,
        settings={
            "choices": [
                {"id": "free", "label": "Free"},
                {"id": "pro", "label": "Pro"},
                {"id": "business", "label": "Business"},
            ]
        },
    )
    q_recommend = add_question(
        db, form, 4,
        type=models.QuestionType.yes_no, title="Would you recommend us to a friend?",
        description=None, required=True, settings={},
    )
    q_rating = add_question(
        db, form, 5,
        type=models.QuestionType.rating, title="Rate your overall experience",
        description=None, required=True, settings={"max": 5, "shape": "star"},
    )
    q_comments = add_question(
        db, form, 6,
        type=models.QuestionType.long_text, title="Anything else you'd like to share?",
        description="Optional — we read all of these.", required=False, settings={},
    )

    sample_answers = [
        {
            "name": "Alex Rivera", "email": "alex@example.com",
            "features": ["builder", "analytics"], "plan": "pro",
            "recommend": True, "rating": 5,
            "comments": "The builder is genuinely fun to use.",
        },
        {
            "name": "Jordan Lee", "email": "jordan@example.com",
            "features": ["builder", "themes", "integrations"], "plan": "business",
            "recommend": True, "rating": 4, "comments": None,
        },
        {
            "name": "Sam Patel", "email": "sam@example.com",
            "features": ["analytics"], "plan": "free",
            "recommend": False, "rating": 2,
            "comments": "Would like more question types.",
        },
        {
            "name": "Taylor Kim", "email": "taylor@example.com",
            "features": ["builder"], "plan": "pro",
            "recommend": True, "rating": 5, "comments": None,
        },
        {
            "name": "Morgan Chen", "email": "morgan@example.com",
            "features": ["builder", "analytics", "themes"], "plan": "business",
            "recommend": True, "rating": 4,
            "comments": "Rating scale could use half-stars.",
        },
    ]

    now = datetime.utcnow()
    for i, sa in enumerate(sample_answers):
        started = now - timedelta(days=len(sample_answers) - i, hours=random.randint(0, 5))
        response = models.Response(form_id=form.id, started_at=started, submitted_at=started + timedelta(minutes=3))
        db.add(response)
        db.flush()
        db.add_all([
            models.Answer(response_id=response.id, question_id=q_name.id, value=sa["name"]),
            models.Answer(response_id=response.id, question_id=q_email.id, value=sa["email"]),
            models.Answer(response_id=response.id, question_id=q_features.id, value=sa["features"]),
            models.Answer(response_id=response.id, question_id=q_plan.id, value=sa["plan"]),
            models.Answer(response_id=response.id, question_id=q_recommend.id, value=sa["recommend"]),
            models.Answer(response_id=response.id, question_id=q_rating.id, value=sa["rating"]),
        ])
        if sa["comments"]:
            db.add(models.Answer(response_id=response.id, question_id=q_comments.id, value=sa["comments"]))

    # One abandoned/partial response — only answered the first two questions,
    # never submitted. Demonstrates partial-response tracking in the results view.
    partial = models.Response(form_id=form.id, started_at=now - timedelta(hours=2), submitted_at=None)
    db.add(partial)
    db.flush()
    db.add_all([
        models.Answer(response_id=partial.id, question_id=q_name.id, value="Casey Nguyen"),
        models.Answer(response_id=partial.id, question_id=q_email.id, value="casey@example.com"),
    ])

    return form


def build_job_application_form(db, creator) -> models.Form:
    form = models.Form(
        creator_id=creator.id,
        title="Job Application — Product Designer",
        description="Apply for the Product Designer role.",
        status=models.FormStatus.published,
        theme={
            "font": "Inter",
            "roundedCorners": "small",
            "colors": {
                "question": "#191919",
                "answer": "#191919",
                "button": "#2563eb",
                "background": "#f8fafc",
            },
            "background": {"layout": "none", "imageUrl": None, "brightness": 0},
        },
        thank_you_message="Thanks for applying! We'll be in touch within a week.",
    )
    db.add(form)
    db.flush()

    q_name = add_question(
        db, form, 0,
        type=models.QuestionType.short_text, title="Full name",
        description=None, required=True,
        settings={
            "media": {
                "url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
                "layout": "split-right",
            }
        },
    )
    q_email = add_question(
        db, form, 1,
        type=models.QuestionType.email, title="Email address",
        description=None, required=True, settings={},
    )
    q_years = add_question(
        db, form, 2,
        type=models.QuestionType.number, title="Years of design experience",
        description=None, required=True, settings={"min": 0, "max": 50},
    )
    q_tools = add_question(
        db, form, 3,
        type=models.QuestionType.multiple_choice, title="Which tools do you use?",
        description="Select all that apply.", required=True,
        settings={
            "choices": [
                {"id": "figma", "label": "Figma"},
                {"id": "sketch", "label": "Sketch"},
                {"id": "framer", "label": "Framer"},
                {"id": "xd", "label": "Adobe XD"},
            ],
            "allowMultiple": True,
        },
    )
    q_remote = add_question(
        db, form, 4,
        type=models.QuestionType.yes_no, title="Are you open to remote work?",
        description=None, required=True, settings={},
    )
    q_pitch = add_question(
        db, form, 5,
        type=models.QuestionType.long_text, title="Why do you want to work here?",
        description=None, required=True, settings={},
    )

    sample_answers = [
        {"name": "Riley Sato", "email": "riley@example.com", "years": 6,
         "tools": ["figma", "framer"], "remote": True,
         "pitch": "I love the craft-first culture and want to help scale the design system."},
        {"name": "Devon Brooks", "email": "devon@example.com", "years": 3,
         "tools": ["figma", "sketch", "xd"], "remote": False,
         "pitch": "Excited about the conversational-form product space."},
        {"name": "Priya Nair", "email": "priya@example.com", "years": 9,
         "tools": ["figma"], "remote": True,
         "pitch": "Ready for a senior role with more ownership over 0-to-1 work."},
    ]

    now = datetime.utcnow()
    for i, sa in enumerate(sample_answers):
        started = now - timedelta(days=len(sample_answers) - i, hours=random.randint(0, 5))
        response = models.Response(form_id=form.id, started_at=started, submitted_at=started + timedelta(minutes=6))
        db.add(response)
        db.flush()
        db.add_all([
            models.Answer(response_id=response.id, question_id=q_name.id, value=sa["name"]),
            models.Answer(response_id=response.id, question_id=q_email.id, value=sa["email"]),
            models.Answer(response_id=response.id, question_id=q_years.id, value=sa["years"]),
            models.Answer(response_id=response.id, question_id=q_tools.id, value=sa["tools"]),
            models.Answer(response_id=response.id, question_id=q_remote.id, value=sa["remote"]),
            models.Answer(response_id=response.id, question_id=q_pitch.id, value=sa["pitch"]),
        ])

    return form


def build_draft_event_form(db, creator) -> models.Form:
    """A draft (unpublished) form, so the dashboard shows a mix of statuses."""
    form = models.Form(
        creator_id=creator.id,
        title="Event RSVP (Draft)",
        description="Still being built — not published yet.",
        status=models.FormStatus.draft,
        theme={},
    )
    db.add(form)
    db.flush()

    add_question(
        db, form, 0,
        type=models.QuestionType.short_text, title="Your name",
        description=None, required=True, settings={},
    )
    add_question(
        db, form, 1,
        type=models.QuestionType.dropdown, title="Will you attend?",
        description=None, required=True,
        settings={"choices": [
            {"id": "yes", "label": "Yes, I'll be there"},
            {"id": "no", "label": "Can't make it"},
            {"id": "maybe", "label": "Maybe"},
        ]},
    )
    return form


def seed(db):
    creator = get_or_create_creator(db)

    if db.query(models.Form).filter_by(creator_id=creator.id).first() is not None:
        print("Database already has forms for the default creator — skipping seed. "
              "Use --reset to wipe and reseed.")
        return

    build_customer_feedback_form(db, creator)
    build_job_application_form(db, creator)
    build_draft_event_form(db, creator)
    db.commit()
    print("Seeded: 2 published forms (with responses) + 1 draft form.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="Wipe all data before reseeding")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)  # safety net if migrations haven't been run
    db = SessionLocal()
    try:
        if args.reset:
            reset_db(db)
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
