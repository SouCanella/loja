"""Reforço DEC-12 — lacunas em `app/services` (gate CI ≥90%)."""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from app.core.security import create_refresh_token, hash_password
from app.models.customer import Customer
from app.models.enums import OrderStatus
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.order import Order, OrderItem, OrderStockAllocation
from app.models.product import Product
from app.models.store import Store
from app.models.user import User, UserRole
from app.services.auth_session import refresh_session_tokens
from app.services.customer_auth import login_customer, register_customer
from app.services.dashboard_summary import _coerce_date, compute_dashboard_summary
from app.services.financial_report import _qpct
from app.services.stock import allocate_stock_for_order, release_stock_for_order
from sqlalchemy.orm import Session


def test_refresh_customer_returns_none_when_customer_removed(db_session: Session) -> None:
    store = Store(name="Rm", slug=f"rm-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    cust = Customer(
        store_id=store.id,
        email="gone@test.com",
        password_hash=hash_password("secret12345"),
    )
    db_session.add(cust)
    db_session.commit()
    rt = create_refresh_token(
        str(cust.id),
        {
            "store_id": str(store.id),
            "email": cust.email,
            "role": "customer",
        },
    )
    db_session.delete(cust)
    db_session.commit()
    assert refresh_session_tokens(db_session, rt) is None


def test_refresh_customer_rejects_store_mismatch(db_session: Session) -> None:
    store = Store(name="S", slug=f"s-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    cust = Customer(
        store_id=store.id,
        email="c@test.com",
        password_hash=hash_password("secret12345"),
    )
    db_session.add(cust)
    db_session.commit()
    wrong = uuid.uuid4()
    rt = create_refresh_token(
        str(cust.id),
        {
            "store_id": str(wrong),
            "email": cust.email,
            "role": "customer",
        },
    )
    assert refresh_session_tokens(db_session, rt) is None


def test_refresh_user_rejects_store_mismatch(db_session: Session) -> None:
    store = Store(name="U", slug=f"u-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    user = User(
        store_id=store.id,
        email=f"adm-{uuid.uuid4().hex[:6]}@test.com",
        password_hash=hash_password("x"),
        role=UserRole.store_admin,
    )
    db_session.add(user)
    db_session.commit()
    wrong = uuid.uuid4()
    rt = create_refresh_token(
        str(user.id),
        {
            "store_id": str(wrong),
            "email": user.email,
            "role": user.role.value,
        },
    )
    assert refresh_session_tokens(db_session, rt) is None


def test_login_customer_success_returns_auth(db_session: Session) -> None:
    store = Store(name="L", slug=f"l-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    register_customer(
        db_session,
        store_id=store.id,
        email="login@test.com",
        password="senha-longa-1",
    )
    out = login_customer(
        db_session,
        store_id=store.id,
        email="login@test.com",
        password="senha-longa-1",
    )
    assert out is not None
    assert out.access_token
    assert out.customer_id
    assert str(out.store_id) == str(store.id)


def test_coerce_date_accepts_datetime_date_str_and_rejects_other() -> None:
    d = date(2026, 4, 1)
    assert _coerce_date(d) == d
    assert _coerce_date(datetime(2026, 4, 1, 12, 0, tzinfo=UTC)) == d
    assert _coerce_date("2026-04-15") == date(2026, 4, 15)
    with pytest.raises(TypeError, match="inesperada"):
        _coerce_date(12345)


def test_compute_dashboard_summary_rejects_inverted_and_long_range(db_session: Session) -> None:
    store = Store(name="D", slug=f"d-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    with pytest.raises(ValueError, match="date_from"):
        compute_dashboard_summary(db_session, store.id, date(2026, 2, 1), date(2026, 1, 1))
    d0 = date(2025, 1, 1)
    d1 = date(2026, 1, 3)
    assert (d1 - d0).days + 1 > 366
    with pytest.raises(ValueError, match="máximo"):
        compute_dashboard_summary(db_session, store.id, d0, d1)


def test_compute_dashboard_ticket_avg_with_one_order(db_session: Session) -> None:
    store = Store(name="T", slug=f"t-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    item = InventoryItem(store_id=store.id, name="Farinha", unit="kg")
    db_session.add(item)
    db_session.flush()
    prod = Product(
        store_id=store.id,
        inventory_item_id=item.id,
        name="Pão",
        price=Decimal("10.00"),
    )
    db_session.add(prod)
    db_session.flush()
    od = Order(
        store_id=store.id,
        status=OrderStatus.confirmado,
        stock_committed=False,
    )
    db_session.add(od)
    db_session.flush()
    db_session.add(
        OrderItem(
            order_id=od.id,
            product_id=prod.id,
            quantity=Decimal("2"),
            unit_price=Decimal("10.00"),
        )
    )
    db_session.commit()

    today = datetime.now(UTC).date()
    out = compute_dashboard_summary(db_session, store.id, today, today)
    assert out.kpis.orders_in_period >= 1
    assert out.kpis.ticket_avg is not None


def test_qpct_none_and_quantize() -> None:
    assert _qpct(None) is None
    assert _qpct(Decimal("10.123456")) == Decimal("10.12")


def test_allocate_idempotent_when_already_committed(db_session: Session) -> None:
    store = Store(name="St", slug=f"st-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    od = Order(
        store_id=store.id,
        status=OrderStatus.confirmado,
        stock_committed=True,
    )
    db_session.add(od)
    db_session.commit()
    allocate_stock_for_order(db_session, od, store.id)


def test_allocate_rejects_product_from_other_store(db_session: Session) -> None:
    sa = Store(name="A", slug=f"a-{uuid.uuid4().hex[:8]}")
    sb = Store(name="B", slug=f"b-{uuid.uuid4().hex[:8]}")
    db_session.add_all([sa, sb])
    db_session.commit()
    inv = InventoryItem(store_id=sa.id, name="Ing", unit="un")
    db_session.add(inv)
    db_session.flush()
    prod = Product(
        store_id=sa.id,
        inventory_item_id=inv.id,
        name="Prod",
        price=Decimal("5.00"),
    )
    db_session.add(prod)
    db_session.flush()
    od = Order(store_id=sb.id, status=OrderStatus.rascunho, stock_committed=False)
    db_session.add(od)
    db_session.flush()
    db_session.add(
        OrderItem(
            order_id=od.id,
            product_id=prod.id,
            quantity=Decimal("1"),
            unit_price=Decimal("5.00"),
        )
    )
    db_session.commit()
    with pytest.raises(ValueError, match="produto inválido"):
        allocate_stock_for_order(db_session, od, sb.id)


def test_allocate_need_zero_skips_extra_batches(db_session: Session) -> None:
    """Primeiro lote cobre a necessidade; ramo `need <= 0` antes de `take`."""
    store = Store(name="B2", slug=f"b2-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    inv = InventoryItem(store_id=store.id, name="I2", unit="un")
    db_session.add(inv)
    db_session.flush()
    b1 = InventoryBatch(
        item_id=inv.id,
        quantity_available=Decimal("5"),
        unit_cost=Decimal("1"),
    )
    b2 = InventoryBatch(
        item_id=inv.id,
        quantity_available=Decimal("10"),
        unit_cost=Decimal("1"),
    )
    db_session.add_all([b1, b2])
    prod = Product(
        store_id=store.id,
        inventory_item_id=inv.id,
        name="P2",
        price=Decimal("3.00"),
    )
    db_session.add(prod)
    db_session.flush()
    od = Order(store_id=store.id, status=OrderStatus.rascunho, stock_committed=False)
    db_session.add(od)
    db_session.flush()
    db_session.add(
        OrderItem(
            order_id=od.id,
            product_id=prod.id,
            quantity=Decimal("1"),
            unit_price=Decimal("3.00"),
        )
    )
    db_session.commit()
    allocate_stock_for_order(db_session, od, store.id)
    assert od.stock_committed is True


def test_release_noop_when_stock_not_committed(db_session: Session) -> None:
    store = Store(name="Nc", slug=f"nc-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    od = Order(store_id=store.id, status=OrderStatus.rascunho, stock_committed=False)
    db_session.add(od)
    db_session.commit()
    release_stock_for_order(db_session, od, store.id)
    assert od.stock_committed is False


def test_release_skips_when_batch_deleted(db_session: Session) -> None:
    store = Store(name="Rel", slug=f"rel-{uuid.uuid4().hex[:8]}")
    db_session.add(store)
    db_session.commit()
    od = Order(
        store_id=store.id,
        status=OrderStatus.cancelado,
        stock_committed=True,
    )
    db_session.add(od)
    db_session.flush()
    fake_batch = uuid.uuid4()
    db_session.add(
        OrderStockAllocation(order_id=od.id, batch_id=fake_batch, quantity=Decimal("1"))
    )
    db_session.commit()
    release_stock_for_order(db_session, od, store.id)
    assert od.stock_committed is False
