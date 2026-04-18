"""Router agregado `/api/v2` (envelope DEC-06)."""

from fastapi import APIRouter

from app.api.v2.endpoints import auth, health, inventory_items, orders, reports_financial

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(reports_financial.router)
api_router.include_router(orders.router)
api_router.include_router(inventory_items.router)
