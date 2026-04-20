"""Router agregado `/api/v2` (envelope DEC-06)."""

from fastapi import APIRouter

from app.api.v2.endpoints import (
    auth,
    categories,
    dashboard,
    health,
    inventory_items,
    me,
    orders,
    production,
    products,
    public_catalog,
    public_customer_auth,
    public_vitrine_orders,
    recipes,
    reports_financial,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(dashboard.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(inventory_items.router)
api_router.include_router(orders.router)
api_router.include_router(recipes.router)
api_router.include_router(production.router)
api_router.include_router(reports_financial.router)
api_router.include_router(public_catalog.router)
api_router.include_router(public_customer_auth.router)
api_router.include_router(public_vitrine_orders.router)
