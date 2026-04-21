"""Clientes (conta vitrine) — listagem e criação pelo painel."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.user import User
from app.schemas.customers_painel import StaffCustomerCreate
from app.services.customer_auth import persist_new_customer


def list_customers_for_store(db: Session, current: User) -> list[Customer]:
    q = select(Customer).where(Customer.store_id == current.store_id).order_by(Customer.created_at.desc())
    return list(db.scalars(q).all())


def create_customer_for_store(db: Session, current: User, body: StaffCustomerCreate) -> Customer:
    try:
        return persist_new_customer(
            db,
            store_id=current.store_id,
            email=str(body.email),
            password=body.password,
        )
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este email já está registado nesta loja.",
        ) from e
