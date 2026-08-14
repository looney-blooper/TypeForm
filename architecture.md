# Typeform Clone — Architecture & Database Design

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, Framer Motion (for the one-question-at-a-time transitions), dnd-kit (drag-and-drop builder), Zustand or React Query for state/data fetching.
- **Backend:** FastAPI (Python), SQLAlchemy ORM, Pydantic schemas, Alembic for migrations.
- **Database:** SQLite (file-based, checked into `backend/app.db` on seed).
- **Auth:** simplified — a single hardcoded "default creator" (no login flow), issued a static creator_id used on all builder/management routes. Public respondent routes need no auth at all.

## High-Level Architecture

```
frontend/  (Next.js)
 ├─ app/
 │   ├─ (creator)/dashboard        -> form list, CRUD
 │   ├─ (creator)/builder/[formId] -> drag-drop question builder + live preview
 │   ├─ (creator)/results/[formId] -> responses table + per-question stats
 │   ├─ f/[slug]                   -> PUBLIC respondent flow (no auth)
 │   └─ api/ (thin proxy or direct fetch to backend)
 ├─ components/
 │   ├─ builder/ (QuestionEditor, QuestionTypePicker, DragList, PreviewPane)
 │   ├─ respondent/ (QuestionSlide, ProgressBar, ThankYouScreen)
 │   └─ ui/ (shared design-system primitives: Button, Modal, Toast, Input)
 └─ lib/ (api client, types, validation schemas via zod)

backend/  (FastAPI)
 ├─ app/
 │   ├─ main.py
 │   ├─ models.py        -> SQLAlchemy models
 │   ├─ schemas.py        -> Pydantic request/response models
 │   ├─ database.py
 │   ├─ routers/
 │   │   ├─ forms.py       (CRUD, publish/unpublish, duplicate)
 │   │   ├─ questions.py   (add/edit/reorder/delete)
 │   │   ├─ public.py      (get published form by slug, submit response)
 │   │   └─ responses.py   (list/view responses, summary stats)
 │   ├─ seed.py
 │   └─ alembic/
```

## Database Schema (SQLite)

### `creators`
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | default seeded creator |
| email | TEXT | |

### `forms`
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| creator_id | FK -> creators.id | |
| title | TEXT | |
| description | TEXT NULL | |
| status | TEXT | `draft` \| `published` |
| slug | TEXT UNIQUE | public share URL, generated on publish |
| theme | JSON | color/font/background — bonus custom themes |
| thank_you_message | TEXT NULL | placeholder for settings |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `questions`
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| form_id | FK -> forms.id | |
| type | TEXT | `short_text`,`long_text`,`multiple_choice`,`dropdown`,`email`,`number`,`yes_no`,`rating` |
| title | TEXT | question prompt |
| description | TEXT NULL | help text |
| order_index | INTEGER | for drag-and-drop ordering |
| required | BOOLEAN | |
| settings | JSON | type-specific config: `{choices: [...]}`, `{ratingMax: 5}`, `{allowMultiple: bool}`, etc. |
| logic | JSON NULL | placeholder for branching bonus feature |

### `responses`
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| form_id | FK -> forms.id | |
| started_at | DATETIME | supports partial-completion bonus |
| submitted_at | DATETIME NULL | null = incomplete |
| respondent_meta | JSON NULL | optional UA/IP-free metadata |

### `answers`
| column | type | notes |
|---|---|---|
| id | INTEGER PK | |
| response_id | FK -> responses.id | |
| question_id | FK -> questions.id | |
| value | JSON | normalized value (string, number, array of choice ids, bool) |

**Indexes:** `forms.slug` (unique), `questions(form_id, order_index)`, `answers(response_id)`, `answers(question_id)` for fast per-question aggregation.

**Why JSON columns:** question `settings`/`logic` and answer `value` vary by question type; SQLite's JSON1 gives flexibility without a wide sparse-column table or type-specific answer tables, while keeping one clean `answers` table for stats aggregation.

## Core API Endpoints (FastAPI)

**Creator/builder (assume default creator, no auth header needed for MVP):**
- `GET /api/forms` — list forms w/ status + response_count
- `POST /api/forms` — create
- `GET /api/forms/{id}` — full form + questions
- `PATCH /api/forms/{id}` — rename, update theme/settings
- `POST /api/forms/{id}/duplicate`
- `DELETE /api/forms/{id}`
- `POST /api/forms/{id}/publish` / `POST /api/forms/{id}/unpublish`
- `POST /api/forms/{id}/questions` — add question
- `PATCH /api/questions/{id}` — edit
- `PATCH /api/forms/{id}/questions/reorder` — bulk order_index update (drag-drop)
- `DELETE /api/questions/{id}`

**Public respondent (no auth, keyed by slug):**
- `GET /api/public/forms/{slug}` — published form + questions (404 if draft)
- `POST /api/public/forms/{slug}/responses` — create response (on first answer, for partial tracking)
- `PATCH /api/public/responses/{id}/answers` — upsert one answer per step, or batch on submit
- `POST /api/public/responses/{id}/submit` — mark submitted_at, validate required fields server-side

**Results:**
- `GET /api/forms/{id}/responses` — list/table
- `GET /api/forms/{id}/responses/{response_id}` — single full response
- `GET /api/forms/{id}/stats` — per-question aggregates (choice counts, avg rating, etc.)
- `GET /api/forms/{id}/responses/export` — CSV bonus

## Respondent Flow Notes
- Frontend fetches the whole published form once (`GET /api/public/forms/{slug}`), then drives the one-question-at-a-time UI client-side (Framer Motion slide transitions), posting answers incrementally so partial responses persist even if the user abandons.
- Keyboard nav: `Enter`/`↓` advance, `↑` go back, per-type validation before allowing advance.

## Seeding
`seed.py` creates 1 default creator, 2–3 published forms (e.g. "Customer Feedback", "Job Application") mixing all 8 question types, plus 5–10 fake responses each, so `/api/forms` and results pages are populated on first run.

## Next Steps
1. Scaffold backend (FastAPI app, models, Alembic, seed script).
2. Scaffold frontend (Next.js app router structure, design tokens matching Typeform's look: big serif/sans headline type, generous whitespace, one accent color, black progress bar).
3. Build builder UI (drag-drop + live preview).
4. Build respondent flow (the hardest polish piece).
5. Build results/stats views.
6. README + deploy.
