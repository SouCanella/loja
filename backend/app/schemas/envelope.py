"""Envelope de API (DEC-06) — usado em `/api/v2`."""

from pydantic import BaseModel, Field

from app.schemas.auth import RegisterResponse, TokenResponse
from app.schemas.catalog import CategoryOut, ProductOut
from app.schemas.customers_public import CustomerAuthResponse, CustomerMeOut
from app.schemas.dashboard import DashboardSummaryOut
from app.schemas.inventory_items import InventoryItemDetailOut, InventoryItemListOut
from app.schemas.orders import OrderDetailOut, OrderOut
from app.schemas.phase3 import FinancialReportOut, ProductionRunOut, RecipeOut
from app.schemas.public_catalog import CategoryPublicOut, ProductPublicOut, StorePublicOut
from app.schemas.public_vitrine_order import PublicOrderCreatedOut
from app.schemas.user import UserMeResponse


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


class DashboardSummaryEnvelope(BaseModel):
    success: bool
    data: DashboardSummaryOut | None = None
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


class UserMeEnvelope(BaseModel):
    success: bool
    data: UserMeResponse | None = None
    errors: list[ApiErrorDetail] | None = None


class CategoryListEnvelope(BaseModel):
    success: bool
    data: list[CategoryOut] | None = None
    errors: list[ApiErrorDetail] | None = None


class CategoryEnvelope(BaseModel):
    success: bool
    data: CategoryOut | None = None
    errors: list[ApiErrorDetail] | None = None


class ProductListEnvelope(BaseModel):
    success: bool
    data: list[ProductOut] | None = None
    errors: list[ApiErrorDetail] | None = None


class ProductEnvelope(BaseModel):
    success: bool
    data: ProductOut | None = None
    errors: list[ApiErrorDetail] | None = None


class InventoryItemDetailEnvelope(BaseModel):
    success: bool
    data: InventoryItemDetailOut | None = None
    errors: list[ApiErrorDetail] | None = None


class OrderDetailEnvelope(BaseModel):
    success: bool
    data: OrderDetailOut | None = None
    errors: list[ApiErrorDetail] | None = None


class RecipeListEnvelope(BaseModel):
    success: bool
    data: list[RecipeOut] | None = None
    errors: list[ApiErrorDetail] | None = None


class RecipeEnvelope(BaseModel):
    success: bool
    data: RecipeOut | None = None
    errors: list[ApiErrorDetail] | None = None


class ProductionRunEnvelope(BaseModel):
    success: bool
    data: ProductionRunOut | None = None
    errors: list[ApiErrorDetail] | None = None


class DeleteSuccessEnvelope(BaseModel):
    """Resposta para DELETE sem payload (sucesso)."""

    success: bool
    data: None = None
    errors: list[ApiErrorDetail] | None = None


class StorePublicEnvelope(BaseModel):
    success: bool
    data: StorePublicOut | None = None
    errors: list[ApiErrorDetail] | None = None


class CategoryPublicListEnvelope(BaseModel):
    success: bool
    data: list[CategoryPublicOut] | None = None
    errors: list[ApiErrorDetail] | None = None


class ProductPublicListEnvelope(BaseModel):
    success: bool
    data: list[ProductPublicOut] | None = None
    errors: list[ApiErrorDetail] | None = None


class ProductPublicEnvelope(BaseModel):
    success: bool
    data: ProductPublicOut | None = None
    errors: list[ApiErrorDetail] | None = None


class CustomerAuthEnvelope(BaseModel):
    success: bool
    data: CustomerAuthResponse | None = None
    errors: list[ApiErrorDetail] | None = None


class CustomerMeEnvelope(BaseModel):
    success: bool
    data: CustomerMeOut | None = None
    errors: list[ApiErrorDetail] | None = None


class PublicOrderCreatedEnvelope(BaseModel):
    success: bool
    data: PublicOrderCreatedOut | None = None
    errors: list[ApiErrorDetail] | None = None
