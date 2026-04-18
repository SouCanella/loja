"""Enums de domínio (DEC-14, movimentos de stock)."""

import enum


class OrderStatus(str, enum.Enum):
    rascunho = "rascunho"
    aguardando_confirmacao = "aguardando_confirmacao"
    confirmado = "confirmado"
    em_producao = "em_producao"
    pronto = "pronto"
    saiu_entrega = "saiu_entrega"
    entregue = "entregue"
    cancelado = "cancelado"


ORDER_STATUS_SEQUENCE: tuple[OrderStatus, ...] = (
    OrderStatus.rascunho,
    OrderStatus.aguardando_confirmacao,
    OrderStatus.confirmado,
    OrderStatus.em_producao,
    OrderStatus.pronto,
    OrderStatus.saiu_entrega,
    OrderStatus.entregue,
)


def order_status_index(status: OrderStatus) -> int | None:
    if status == OrderStatus.cancelado:
        return None
    try:
        return ORDER_STATUS_SEQUENCE.index(status)
    except ValueError:
        return None


class StockMovementType(str, enum.Enum):
    sale_out = "sale_out"
    sale_reversal = "sale_reversal"
    adjustment = "adjustment"
    initial_in = "initial_in"
    production_out = "production_out"
    production_in = "production_in"
