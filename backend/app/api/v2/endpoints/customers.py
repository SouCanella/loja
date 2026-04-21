"""Contas de cliente na vitrine — painel (lojista)."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import customers_painel as customers_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.customers_painel import StaffCustomerCreate, StaffCustomerOut
from app.schemas.envelope import StaffCustomerEnvelope, StaffCustomerListEnvelope

router = APIRouter(tags=["customers-v2"])


@router.get("/customers", response_model=StaffCustomerListEnvelope)
def list_customers_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> StaffCustomerListEnvelope:
    rows = customers_handlers.list_customers_for_store(db, current)
    data = [StaffCustomerOut.model_validate(r) for r in rows]
    return StaffCustomerListEnvelope(success=True, data=data, errors=None)


@router.post("/customers", response_model=StaffCustomerEnvelope, status_code=status.HTTP_201_CREATED)
def create_customer_v2(
    body: StaffCustomerCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> StaffCustomerEnvelope:
    row = customers_handlers.create_customer_for_store(db, current, body)
    return StaffCustomerEnvelope(success=True, data=StaffCustomerOut.model_validate(row), errors=None)
