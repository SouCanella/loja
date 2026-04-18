"""Envelope de API (DEC-06) — usado em `/api/v2`."""

from pydantic import BaseModel, Field

from app.schemas.auth import RegisterResponse, TokenResponse
from app.schemas.inventory_items import InventoryItemListOut
from app.schemas.orders import OrderOut
from app.schemas.phase3 import FinancialReportOut


class ApiErrorDetail(BaseModel):
    message: str
    code: str | None = None
    field: str | None = None


class HealthData(BaseModel):
    status: str = Field(..., description="Smoke da API v2")


class HealthEnvelope(BaseModel):
    success: bool
    data: HealthData | None = None
    errors: list[ApiErrorDetail] | None = None


class FinancialReportEnvelope(BaseModel):
    success: bool
    data: FinancialReportOut | None = None
    errors: list[ApiErrorDetail] | None = None


class TokenEnvelope(BaseModel):
    success: bool
    data: TokenResponse | None = None
    errors: list[ApiErrorDetail] | None = None


class RegisterEnvelope(BaseModel):
    success: bool
    data: RegisterResponse | None = None
    errors: list[ApiErrorDetail] | None = None


class OrderListEnvelope(BaseModel):
    success: bool
    data: list[OrderOut] | None = None
    errors: list[ApiErrorDetail] | None = None


class InventoryItemListEnvelope(BaseModel):
    success: bool
    data: list[InventoryItemListOut] | None = None
    errors: list[ApiErrorDetail] | None = None
