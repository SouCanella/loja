"""Perfil do utilizador autenticado."""

from typing import Annotated

from app.api.deps import get_current_user
from app.api.handlers import me as me_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import StorePricingPatch, UserMeResponse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserMeResponse)
def read_me(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeResponse:
    return me_handlers.read_me(db, current)


@router.patch("/me/store-pricing", response_model=UserMeResponse)
def patch_store_pricing(
    body: StorePricingPatch,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeResponse:
    return me_handlers.patch_store_pricing(db, current, body)
