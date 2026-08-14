import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import forms, public, questions, responses

app = FastAPI(title="Typeform Clone API")

# Comma-separated list, e.g. "https://myapp.vercel.app,https://myapp.com".
# Defaults to "*" for local dev / docker-compose convenience.
_allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
allow_origins = ["*"] if _allowed_origins == "*" else [o.strip() for o in _allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(questions.router)
app.include_router(public.router)
app.include_router(responses.router)


@app.on_event("startup")
def on_startup():
    # Tables are normally created via Alembic migrations (see /alembic).
    # create_all is a no-op safety net for a schema that's already current,
    # and lets `uvicorn app.main:app` work standalone in a pinch.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
