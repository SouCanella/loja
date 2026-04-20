"""Analytics de vitrine — ingestão e resumo."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

ALLOWED_EVENT_TYPES = frozenset(
    {"page_view", "product_view", "add_to_cart", "checkout_open"},
)


class VitrineAnalyticsEventIn(BaseModel):
    event_type: str = Field(..., max_length=32)
    path: str = Field(..., max_length=512)
    session_id: str = Field(..., min_length=8, max_length=64)
    product_id: UUID | None = None
    occurred_at: datetime | None = None

    @field_validator("event_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ALLOWED_EVENT_TYPES:
            raise ValueError("event_type inválido")
        return v


class VitrineAnalyticsBatchIn(BaseModel):
    events: list[VitrineAnalyticsEventIn] = Field(..., min_length=1, max_length=50)


class VitrineAnalyticsIngestOut(BaseModel):
    accepted: int


class TopProductViewRow(BaseModel):
    product_id: UUID
    name: str
    views: int


class VitrineAnalyticsSummaryOut(BaseModel):
    date_from: date
    date_to: date
    distinct_sessions: int
    events_by_type: dict[str, int]
    top_products_by_view: list[TopProductViewRow]
