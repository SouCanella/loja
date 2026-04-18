"""Smoke DEC-06."""

from fastapi import APIRouter

from app.schemas.envelope import HealthData, HealthEnvelope

router = APIRouter(tags=["health-v2"])


@router.get("/health", response_model=HealthEnvelope)
def health_v2() -> HealthEnvelope:
    return HealthEnvelope(success=True, data=HealthData(status="ok"), errors=None)
