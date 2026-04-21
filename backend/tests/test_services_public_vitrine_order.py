"""Testes directos — `create_order_from_vitrine` (validação de checkout)."""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from app.models.customer import Customer
from app.models.inventory import InventoryItem
from app.models.product import Product
from app.models.store import Store
from app.schemas.public_vitrine_order import PublicOrderCreate, PublicOrderItemCreate
from app.services.public_vitrine_order import create_order_from_vitrine
from fastapi import HTTPException
from sqlalchemy.orm import Session


@pytest.fixture
def no_public_order_rate(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.services.public_vitrine_order.register_public_order_attempt",
        lambda *a, **k: None,
    )


def _store_with_product(
    db_session: Session,
    *,
    theme: dict | None = None,
) -> tuple[Store, uuid.UUID]:
    sid = uuid.uuid4()
    st = Store(id=sid, name="T", slug=f"t-{sid.hex[:8]}", theme=theme or {})
    db_session.add(st)
    inv = InventoryItem(id=uuid.uuid4(), store_id=sid, name="I", unit="un")
    db_session.add(inv)
    pid = uuid.uuid4()
    db_session.add(
        Product(
            id=pid,
            store_id=sid,
            inventory_item_id=inv.id,
            name="P",
            price=Decimal("10"),
            active=True,
        )
    )
    db_session.commit()
    return st, pid


def test_invalid_delivery_option(no_public_order_rate: None, db_session: Session) -> None:
    st, pid = _store_with_product(
        db_session,
        theme={"vitrine": {"delivery_option_ids": ["retirada"]}},
    )
    body = PublicOrderCreate(
        items=[PublicOrderItemCreate(product_id=pid, quantity=Decimal("1"))],
        customer_name="A",
        customer_phone="11999999999",
        delivery_option_id="uber",
        payment_method_id="pix",
        website="",
    )
    with pytest.raises(HTTPException) as ei:
        create_order_from_vitrine(db_session, st, body, customer=None, client_ip="127.0.0.1")
    assert ei.value.status_code == 400
    assert "recebimento" in ei.value.detail.lower()


def test_invalid_payment_method(no_public_order_rate: None, db_session: Session) -> None:
    st, pid = _store_with_product(
        db_session,
        theme={"vitrine": {"payment_methods": [{"id": "pix", "enabled": True}]}},
    )
    body = PublicOrderCreate(
        items=[PublicOrderItemCreate(product_id=pid, quantity=Decimal("1"))],
        customer_name="A",
        customer_phone="11999999999",
        delivery_option_id="retirada",
        payment_method_id="entrega_dinheiro",
        website="",
    )
    with pytest.raises(HTTPException) as ei:
        create_order_from_vitrine(db_session, st, body, customer=None, client_ip="127.0.0.1")
    assert ei.value.status_code == 400
    assert "pagamento" in ei.value.detail.lower()


def test_customer_from_other_store_forbidden(
    no_public_order_rate: None,
    db_session: Session,
) -> None:
    st_a, _ = _store_with_product(db_session)
    st_b, pid_b = _store_with_product(db_session)
    cust = Customer(
        store_id=st_a.id,
        email=f"c-{uuid.uuid4().hex[:8]}@t.com",
        password_hash="x",
    )
    db_session.add(cust)
    db_session.commit()
    body = PublicOrderCreate(
        items=[PublicOrderItemCreate(product_id=pid_b, quantity=Decimal("1"))],
        customer_name="A",
        customer_phone="11999999999",
        delivery_option_id="retirada",
        payment_method_id="pix",
        website="",
    )
    with pytest.raises(HTTPException) as ei:
        create_order_from_vitrine(db_session, st_b, body, customer=cust, client_ip="127.0.0.1")
    assert ei.value.status_code == 403
