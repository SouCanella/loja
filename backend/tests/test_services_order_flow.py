"""Testes unitários — transições de pedido (sem BD)."""

import pytest
from app.models.enums import OrderStatus
from app.services.order_flow import is_transition_allowed_mvp, needs_stock_commit


@pytest.mark.parametrize(
    ("old", "new", "expected"),
    [
        (OrderStatus.rascunho, OrderStatus.rascunho, True),
        (OrderStatus.rascunho, OrderStatus.confirmado, True),
        (OrderStatus.entregue, OrderStatus.entregue, True),
        (OrderStatus.entregue, OrderStatus.confirmado, False),
        (OrderStatus.cancelado, OrderStatus.rascunho, False),
        (OrderStatus.pronto, OrderStatus.saiu_entrega, True),
    ],
)
def test_is_transition_allowed_mvp(
    old: OrderStatus, new: OrderStatus, expected: bool
) -> None:
    assert is_transition_allowed_mvp(old, new) is expected


@pytest.mark.parametrize(
    ("old", "new", "expected"),
    [
        (OrderStatus.rascunho, OrderStatus.confirmado, True),
        (OrderStatus.aguardando_confirmacao, OrderStatus.confirmado, True),
        (OrderStatus.confirmado, OrderStatus.pronto, False),
        (OrderStatus.confirmado, OrderStatus.cancelado, False),
        (OrderStatus.rascunho, OrderStatus.cancelado, False),
        (OrderStatus.cancelado, OrderStatus.confirmado, False),
    ],
)
def test_needs_stock_commit(old: OrderStatus, new: OrderStatus, expected: bool) -> None:
    assert needs_stock_commit(old, new) is expected
