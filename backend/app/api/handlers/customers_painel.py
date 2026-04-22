"""Clientes da loja — listagem e criação pelo painel."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.user import User
from app.schemas.customers_painel import StaffCustomerCreate


def list_customers_for_store(db: Session, current: User) -> list[Customer]:
    q = select(Customer).where(Customer.store_id == current.store_id).order_by(
        Customer.created_at.desc()
    )
    return list(db.scalars(q).all())


def create_customer_for_store(db: Session, current: User, body: StaffCustomerCreate) -> Customer:
    em = str(body.email).lower().strip() if body.email else None
    cust = Customer(
        store_id=current.store_id,
        source="painel_manual",
        contact_name=body.contact_name.strip(),
        phone=body.phone.strip(),
        email=em,
        password_hash=None,
    )
    db.add(cust)
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este email já está registado nesta loja.",
        ) from e
    db.refresh(cust)
    return cust
