"""Registo e sessão de clientes da vitrine (por loja)."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.customer import Customer
from app.schemas.auth import TokenResponse
from app.schemas.customers_public import CustomerAuthResponse


def issue_tokens_for_customer(customer: Customer) -> TokenResponse:
    extra = {
        "store_id": str(customer.store_id),
        "email": customer.email,
        "role": "customer",
    }
    access = create_access_token(str(customer.id), extra)
    refresh = create_refresh_token(str(customer.id), extra)
    return TokenResponse(access_token=access, token_type="bearer", refresh_token=refresh)


def register_customer(
    db: Session,
    *,
    store_id: UUID,
    email: str,
    password: str,
) -> CustomerAuthResponse:
    em = email.lower().strip()
    cust = Customer(
        store_id=store_id,
        email=em,
        password_hash=hash_password(password),
    )
    db.add(cust)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(cust)
    tokens = issue_tokens_for_customer(cust)
    return CustomerAuthResponse(
        access_token=tokens.access_token,
        token_type=tokens.token_type,
        refresh_token=tokens.refresh_token,
        customer_id=cust.id,
        store_id=cust.store_id,
    )


def login_customer(
    db: Session,
    *,
    store_id: UUID,
    email: str,
    password: str,
) -> CustomerAuthResponse | None:
    em = email.lower().strip()
    cust = db.scalars(
        select(Customer).where(Customer.store_id == store_id, Customer.email == em)
    ).first()
    if cust is None or not verify_password(password, cust.password_hash):
        return None
    tokens = issue_tokens_for_customer(cust)
    return CustomerAuthResponse(
        access_token=tokens.access_token,
        token_type=tokens.token_type,
        refresh_token=tokens.refresh_token,
        customer_id=cust.id,
        store_id=cust.store_id,
    )

