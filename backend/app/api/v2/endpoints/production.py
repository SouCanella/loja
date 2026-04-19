"""Produção — envelope DEC-06."""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import production as production_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import ProductionRunEnvelope
from app.schemas.phase3 import ProductionRequest

router = APIRouter(tags=["production-v2"])


@router.post(
    "/production",
    response_model=ProductionRunEnvelope,
    status_code=status.HTTP_201_CREATED,
)
def post_production_v2(
    body: ProductionRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> ProductionRunEnvelope:
    data = production_handlers.post_production(db, current, body, idempotency_key=idempotency_key)
    return ProductionRunEnvelope(success=True, data=data, errors=None)
