"""Healthcheck na versão da API."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def api_health() -> dict[str, str]:
    return {"status": "ok"}
