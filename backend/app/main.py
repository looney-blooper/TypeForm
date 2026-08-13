from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import forms, public, questions, responses

app = FastAPI(title="Typeform Clone API")

app.add_middleware(
    CORSMiddleware,
    # In production, replace "*" with the deployed frontend origin(s).
    allow_origins=["*"],
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
