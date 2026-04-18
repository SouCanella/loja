"""Pedidos — leitura com envelope DEC-06."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.envelope import OrderListEnvelope
from app.schemas.orders import OrderOut
from app.services.order_queries import list_orders_for_store

router = APIRouter(tags=["orders-v2"])


@router.get("/orders", response_model=OrderListEnvelope)
def list_orders_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> OrderListEnvelope:
    rows: list[Order] = list_orders_for_store(db, current.store_id)
    data = [OrderOut.model_validate(r) for r in rows]
    return OrderListEnvelope(success=True, data=data, errors=None)
