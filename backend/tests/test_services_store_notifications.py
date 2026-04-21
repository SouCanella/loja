"""Testes — inbox e marcar lidas (`store_notifications`)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.store import Store
from app.models.store_notification import StoreNotification
from app.models.user import User, UserRole
from app.services.store_notifications import (
    add_new_vitrine_order_notification,
    list_inbox,
    mark_all_read,
    mark_read,
)
from sqlalchemy import select
from sqlalchemy.orm import Session


def _store_and_user(db: Session) -> tuple[Store, User]:
    st = Store(name="N", slug=f"n-{uuid.uuid4().hex[:8]}")
    db.add(st)
    db.commit()
    u = User(
        store_id=st.id,
        email=f"u-{uuid.uuid4().hex[:6]}@t.com",
        password_hash="x",
        role=UserRole.store_admin,
    )
    db.add(u)
    db.commit()
    return st, u


def test_add_new_vitrine_order_notification(db_session: Session) -> None:
    st, _ = _store_and_user(db_session)
    oid = uuid.uuid4()
    o = Order(
        id=oid,
        store_id=st.id,
        status=OrderStatus.aguardando_confirmacao,
        stock_committed=False,
    )
    db_session.add(o)
    db_session.commit()
    add_new_vitrine_order_notification(db_session, o)
    db_session.commit()
    q = select(StoreNotification).where(StoreNotification.store_id == st.id)
    rows = list(db_session.scalars(q).all())
    assert len(rows) == 1
    assert rows[0].order_id == oid
    assert "Novo pedido" in rows[0].title


def test_list_inbox_limit_and_unread(db_session: Session) -> None:
    st, _ = _store_and_user(db_session)
    for i in range(3):
        db_session.add(
            StoreNotification(
                store_id=st.id,
                kind="t",
                title=f"T{i}",
                read_at=None if i < 2 else datetime.now(UTC),
            )
        )
    db_session.commit()
    rows, unread = list_inbox(db_session, st.id, limit=2)
    assert len(rows) == 2
    assert unread == 2


def test_mark_read_skips_wrong_store_and_idempotent(db_session: Session) -> None:
    st, user = _store_and_user(db_session)
    other = Store(name="O", slug=f"o-{uuid.uuid4().hex[:8]}")
    db_session.add(other)
    db_session.commit()
    n_ok = StoreNotification(store_id=st.id, kind="k", title="a", read_at=None)
    n_other = StoreNotification(store_id=other.id, kind="k", title="b", read_at=None)
    db_session.add_all([n_ok, n_other])
    db_session.commit()
    assert mark_read(db_session, user, [n_ok.id, n_other.id, uuid.uuid4()]) == 1
    db_session.refresh(n_ok)
    assert n_ok.read_at is not None
    assert mark_read(db_session, user, [n_ok.id]) == 0


def test_mark_all_read(db_session: Session) -> None:
    st, user = _store_and_user(db_session)
    db_session.add_all(
        [
            StoreNotification(store_id=st.id, kind="k", title="a", read_at=None),
            StoreNotification(store_id=st.id, kind="k", title="b", read_at=None),
        ]
    )
    db_session.commit()
    assert mark_all_read(db_session, user) == 2
