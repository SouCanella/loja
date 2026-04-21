"""Testes — `get_product_for_order_line`."""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from app.models.inventory import InventoryItem
from app.models.product import Product
from app.models.store import Store
from app.services.order_line_items import get_product_for_order_line
from fastapi import HTTPException
from sqlalchemy.orm import Session


def test_get_product_rejects_wrong_store_or_inactive(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="S", slug=f"s-{sid.hex[:8]}"))
    inv = InventoryItem(id=uuid.uuid4(), store_id=sid, name="I", unit="un")
    db_session.add(inv)
    pid = uuid.uuid4()
    db_session.add(
        Product(
            id=pid,
            store_id=sid,
            inventory_item_id=inv.id,
            name="P",
            price=Decimal("1"),
            active=False,
        )
    )
    db_session.commit()
    with pytest.raises(HTTPException) as ei:
        get_product_for_order_line(db_session, product_id=pid, store_id=sid)
    assert ei.value.status_code == 400
    with pytest.raises(HTTPException):
        get_product_for_order_line(db_session, product_id=pid, store_id=uuid.uuid4())


def test_get_product_rejects_catalog_unavailable(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="S2", slug=f"s2-{sid.hex[:8]}"))
    inv = InventoryItem(id=uuid.uuid4(), store_id=sid, name="I", unit="un")
    db_session.add(inv)
    pid = uuid.uuid4()
    db_session.add(
        Product(
            id=pid,
            store_id=sid,
            inventory_item_id=inv.id,
            name="P",
            price=Decimal("1"),
            active=True,
            catalog_sale_mode="unavailable",
        )
    )
    db_session.commit()
    with pytest.raises(HTTPException) as ei:
        get_product_for_order_line(
            db_session,
            product_id=pid,
            store_id=sid,
            reject_catalog_unavailable=True,
        )
    assert "indisponível" in ei.value.detail.lower()
