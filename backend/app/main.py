"""API FastAPI — loja (multi-tenant)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description="Backend multi-tenant — Fase 1 (auth, stores, users).",
    openapi_url="/openapi.json",
    docs_url=None,  # sem Swagger UI; ver `doc/api/` (offline) ou `/redoc` com API no ar
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health() -> dict[str, str]:
    """Smoke check (compatível com Fase 0 / Docker)."""
    return {"status": "ok"}
