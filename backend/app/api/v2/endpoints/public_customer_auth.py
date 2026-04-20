"""Registo e login de clientes da vitrine (público, por loja)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.api.handlers import public_catalog as public_handlers
from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.customers_public import (
    CustomerLoginRequest,
    CustomerMeOut,
    CustomerRegisterRequest,
)
from app.schemas.envelope import CustomerAuthEnvelope, CustomerMeEnvelope
from app.services.customer_auth import login_customer, register_customer

router = APIRouter(prefix="/public/stores", tags=["public-customers-v2"])


@router.post(
    "/{store_slug}/customers/register",
    response_model=CustomerAuthEnvelope,
    status_code=status.HTTP_201_CREATED,
)
def register_customer_v2(
    store_slug: str,
    body: CustomerRegisterRequest,
    db: Annotated[Session, Depends(get_db)],
) -> CustomerAuthEnvelope:
    store = public_handlers.get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    try:
        out = register_customer(
            db,
            store_id=store.id,
            email=str(body.email),
            password=body.password,
        )
        return CustomerAuthEnvelope(success=True, data=out, errors=None)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este email já está registado nesta loja",
        ) from None


@router.post("/{store_slug}/customers/login", response_model=CustomerAuthEnvelope)
def login_customer_v2(
    store_slug: str,
    body: CustomerLoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> CustomerAuthEnvelope:
    store = public_handlers.get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    out = login_customer(
        db,
        store_id=store.id,
        email=str(body.email),
        password=body.password,
    )
    if out is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou palavra-passe incorretos",
        )
    return CustomerAuthEnvelope(success=True, data=out, errors=None)


@router.get("/{store_slug}/customers/me", response_model=CustomerMeEnvelope)
def customer_me_v2(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
    customer: Annotated[Customer, Depends(get_current_customer)],
) -> CustomerMeEnvelope:
    store = public_handlers.get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    if customer.store_id != store.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Loja não corresponde ao token",
        )
    return CustomerMeEnvelope(
        success=True,
        data=CustomerMeOut(email=customer.email, store_slug=store.slug),
        errors=None,
    )
