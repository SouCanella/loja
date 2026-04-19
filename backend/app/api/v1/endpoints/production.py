"""Ordem de produção (idempotência RNF-Arq-02b)."""

from typing import Annotated

from app.api.deps import get_current_user
from app.api.handlers import production as production_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.phase3 import ProductionRequest, ProductionRunOut
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["production"])


@router.post("", response_model=ProductionRunOut, status_code=status.HTTP_201_CREATED)
def post_production(
    body: ProductionRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> ProductionRunOut:
    return production_handlers.post_production(db, current, body, idempotency_key=idempotency_key)
