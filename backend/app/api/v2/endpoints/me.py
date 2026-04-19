"""Perfil — envelope DEC-06."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import me as me_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import UserMeEnvelope
from app.schemas.user import StorePricingPatch

router = APIRouter(tags=["me-v2"])


@router.get("/me", response_model=UserMeEnvelope)
def read_me_v2(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeEnvelope:
    data = me_handlers.read_me(db, current)
    return UserMeEnvelope(success=True, data=data, errors=None)


@router.patch("/me/store-pricing", response_model=UserMeEnvelope)
def patch_store_pricing_v2(
    body: StorePricingPatch,
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeEnvelope:
    data = me_handlers.patch_store_pricing(db, current, body)
    return UserMeEnvelope(success=True, data=data, errors=None)
