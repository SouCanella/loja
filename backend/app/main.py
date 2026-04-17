"""Aplicação mínima — Fase 0 (healthcheck)."""

from fastapi import FastAPI

app = FastAPI(
    title="Loja API",
    version="0.1.0",
    description="Backend multi-tenant — evolução conforme doc/fases.",
)


@app.get("/health")
def health() -> dict[str, str]:
    """Smoke check para Docker e monitorização."""
    return {"status": "ok"}
