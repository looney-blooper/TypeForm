# Formly — A Typeform Clone

A functional clone of Typeform: a drag-and-drop form builder, a polished
one-question-at-a-time respondent experience, and a results/analytics view.

**Live demo:** https://type-form-nu.vercel.app/dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Framer Motion, dnd-kit |
| Backend | FastAPI (Python), SQLAlchemy ORM, Pydantic v2, Alembic migrations |
| Database | SQLite |
| Deployment | Vercel (frontend) + Render, Docker (backend) |

## Architecture Overview

```
frontend/                    Next.js app
 ├─ app/
 │   ├─ dashboard/            Form list — create/duplicate/publish/delete
 │   ├─ builder/[formId]/     Drag-drop builder + live preview + theme editor
 │   ├─ f/[slug]/             PUBLIC respondent flow (no auth)
 │   └─ results/[formId]/     Response table + per-question stats
 ├─ components/
 │   ├─ builder/               Question editor, theme gallery, media picker, dnd list
 │   ├─ respondent/             QuestionRenderer, ProgressBar, transitions, layouts
 │   ├─ dashboard/              Form cards, delete modal
 │   ├─ results/                Stats summary, response detail modal
 │   └─ ui/                     Shared Button/Modal/Toast/Pill primitives
 └─ lib/                        API client, shared TS types, validation helpers

backend/                     FastAPI app
 ├─ app/
 │   ├─ main.py                App entrypoint, CORS, router wiring
 │   ├─ models.py              SQLAlchemy ORM models
 │   ├─ schemas.py              Pydantic request/response models + answer validation
 │   ├─ deps.py                  Simplified "auth" (single default creator)
 │   ├─ seed.py                  Seeds demo forms + responses
 │   └─ routers/
 │       ├─ forms.py             Form CRUD, publish/unpublish, duplicate
 │       ├─ questions.py          Question CRUD + drag-drop reorder
 │       ├─ public.py             No-auth respondent flow (start/save/submit)
 │       └─ responses.py          Results: list, detail, per-question stats
 └─ alembic/                   Migrations
```

**Key design decision:** the same `QuestionRenderer` and `QuestionLayout`
components are used by both the builder's live-preview canvas and the real
respondent flow (`app/f/[slug]`). This guarantees the preview a creator
sees while building is pixel-accurate to what respondents actually get —
they can't drift apart because they're literally the same code path.

## Database Schema

```
creators (1) ──< forms (1) ──< questions
                   │
                   └──< responses (1) ──< answers >── questions
```

| Table | Notes |
|---|---|
| `creators` | Single seeded default creator (see Assumptions) |
| `forms` | `status` (draft/published), unique `slug` for the public link, `theme` (JSON — colors, rounded corners, background image), `thank_you_message` |
| `questions` | `type` enum (8 types), `order_index` for drag-drop position, `required`, `settings` (JSON — choices, rating max, per-question image + layout), `logic` (JSON, reserved for the branching bonus feature) |
| `responses` | `started_at` always set, `submitted_at` is `NULL` until final submit — this is what enables partial-response tracking |
| `answers` | `value` (JSON — shape depends on question type; a unique constraint on `(response_id, question_id)` enables safe upsert for save-as-you-go) |

JSON columns are used for `settings`/`theme`/`value` rather than a wide
sparse-column table or per-type answer tables, so multiple question types
share one clean schema and adding a new type/setting never requires a
migration.

**Multi-select** is handled as a variant of `multiple_choice`
(`settings.allowMultiple`), not a separate question type — this matches
how Typeform itself treats it, and it's validated server-side
(`schemas.validate_answer_value`) so a single-select question can never
receive a list, and vice versa.

## API Overview

All endpoints are under `/api`. Full interactive docs at `/docs` (FastAPI's
built-in Swagger UI) once the backend is running.

**Forms** (creator-side, acts as the single default creator)
- `GET/POST /api/forms` — list / create
- `GET/PATCH/DELETE /api/forms/{id}`
- `POST /api/forms/{id}/duplicate`
- `POST /api/forms/{id}/publish` / `/unpublish`

**Questions**
- `POST /api/forms/{id}/questions` — add
- `PATCH/DELETE /api/questions/{id}`
- `PATCH /api/forms/{id}/questions/reorder` — bulk drag-drop reorder

**Public respondent flow** (no auth)
- `GET /api/public/forms/{slug}` — fetch a published form (404 if draft/unpublished)
- `POST /api/public/forms/{slug}/responses` — start a response
- `PATCH /api/public/responses/{id}/answers` — save-as-you-go
- `POST /api/public/responses/{id}/submit` — final submit, enforces required fields server-side

**Results**
- `GET /api/forms/{id}/responses` — list (shows partial vs. complete)
- `GET /api/forms/{id}/responses/{response_id}` — full detail
- `GET /api/forms/{id}/stats` — per-question aggregates (choice counts, rating avg/min/max, yes/no split)

## Local Setup

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```
Frontend: http://localhost:3000 · Backend: http://localhost:8000/docs

### Option B — Run each service natively

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local   # or create one with NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full Render + Vercel walkthrough.
Deployed at: **https://type-form-nu.vercel.app/dashboard**

## Assumptions

- **Creator auth is mocked**, per the assignment's allowed simplification —
  every builder/management request acts as a single default creator,
  lazily created on first use (`app/deps.py`). There's no login screen.
- **The respondent flow requires no authentication whatsoever** — anyone
  with a published form's link can fill it out, matching real Typeform.
- **Draft forms are never resolvable via the public API** — the slug
  exists from creation, but `/api/public/forms/{slug}` 404s until the
  form is published, so an unpublished link can't leak content.
- **Partial responses are tracked but excluded from stats** — a `Response`
  row is created the moment someone starts filling a form (`submitted_at`
  is `NULL`), so abandoned fills show up in the results table as
  "Partial," but per-question summary stats only count completed
  responses so they aren't skewed by incomplete data.
- **SQLite** was used as specified in the assignment. On Render's free
  tier this means the database resets on redeploy/spin-down (no
  persistent disk on that plan) — the backend auto-reseeds on startup so
  the app is always in a usable demo state; see `DEPLOYMENT.md` for how
  to add real persistence.
- **Logic jumps/branching, integrations, and file-upload questions** are
  present as explicit "Coming soon" placeholders in the builder (per the
  assignment's allowance for mocked sections), not implemented.
