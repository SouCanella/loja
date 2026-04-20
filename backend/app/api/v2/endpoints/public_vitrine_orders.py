"""Pedido público a partir da vitrine (IP-11)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_optional_customer
from app.api.handlers import public_catalog as public_handlers
from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.envelope import PublicOrderCreatedEnvelope
from app.schemas.public_vitrine_order import PublicOrderCreate, PublicOrderCreatedOut
from app.services.public_vitrine_order import create_order_from_vitrine, order_short_code

router = APIRouter(prefix="/public/stores", tags=["public-orders-v2"])


@router.post(
    "/{store_slug}/orders",
    response_model=PublicOrderCreatedEnvelope,
    status_code=status.HTTP_201_CREATED,
)
def create_public_order_v2(
    store_slug: str,
    body: PublicOrderCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    customer: Annotated[Customer | None, Depends(get_optional_customer)],
) -> PublicOrderCreatedEnvelope:
    store = public_handlers.get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    client_ip = request.client.host if request.client else "unknown"
    order = create_order_from_vitrine(db, store, body, customer=customer, client_ip=client_ip)
    return PublicOrderCreatedEnvelope(
        success=True,
        data=PublicOrderCreatedOut(order_id=order.id, short_code=order_short_code(order.id)),
        errors=None,
    )
