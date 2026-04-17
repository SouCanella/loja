"""Perfil do utilizador autenticado."""

from typing import Annotated

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserMeResponse
from fastapi import APIRouter, Depends

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserMeResponse)
def read_me(current: Annotated[User, Depends(get_current_user)]) -> User:
    return current
