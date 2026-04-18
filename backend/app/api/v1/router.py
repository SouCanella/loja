"""Router agregado `/api/v1`."""

from app.api.v1.endpoints import (
    auth,
    categories,
    health,
    inventory_items,
    me,
    orders,
    production,
    products,
    public_catalog,
    recipes,
    reports_financial,
)
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(categories.router, prefix="/categories")
api_router.include_router(products.router, prefix="/products")
api_router.include_router(inventory_items.router, prefix="/inventory-items")
api_router.include_router(orders.router, prefix="/orders")
api_router.include_router(recipes.router, prefix="/recipes")
api_router.include_router(production.router, prefix="/production")
api_router.include_router(reports_financial.router, prefix="/reports")
api_router.include_router(public_catalog.router, prefix="/public")
