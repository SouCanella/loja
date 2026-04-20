"""Montagem do payload de impressão de pedido."""

from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.product import Product
from app.models.store import Store
from app.models.user import User
from app.schemas.print import OrderPrintLineOut, OrderPrintOut

from .orders import load_order_detail

_Q2 = Decimal("0.01")


def effective_print_config(store: Store) -> dict:
    defaults: dict = {
        "channel": "off",
        "paper_width_mm": 80,
        "shipping_label_size": "a4",
    }
    raw = store.config if isinstance(store.config, dict) else {}
    p = raw.get("print")
    if isinstance(p, dict):
        for k in ("channel", "paper_width_mm", "shipping_label_size"):
            if k in p:
                defaults[k] = p[k]
    ch = defaults.get("channel")
    if ch not in ("off", "usb", "bluetooth"):
        defaults["channel"] = "off"
    w = defaults.get("paper_width_mm")
    if w not in (58, 80):
        try:
            wi = int(w)  # type: ignore[arg-type]
            defaults["paper_width_mm"] = 80 if wi != 58 else 58
        except (TypeError, ValueError):
            defaults["paper_width_mm"] = 80
    sz = defaults.get("shipping_label_size")
    if sz not in ("a4", "a6"):
        defaults["shipping_label_size"] = "a4"
    return defaults


def _money_str(d: Decimal) -> str:
    return str(d.quantize(_Q2, rounding=ROUND_HALF_UP))


def build_order_print_out(db: Session, store: Store, order: Order) -> OrderPrintOut:
    product_ids = [it.product_id for it in order.items]
    names: dict[UUID, str] = {}
    if product_ids:
        rows = db.scalars(select(Product).where(Product.id.in_(product_ids))).all()
        names = {p.id: p.name for p in rows}

    lines_out: list[OrderPrintLineOut] = []
    total = Decimal("0")
    for it in order.items:
        qty = it.quantity
        up = it.unit_price
        lt = (qty * up).quantize(_Q2, rounding=ROUND_HALF_UP)
        total += lt
        lines_out.append(
            OrderPrintLineOut(
                product_name=names.get(it.product_id, "Produto"),
                quantity=str(qty),
                unit_price=_money_str(up),
                line_total=_money_str(lt),
            )
        )

    return OrderPrintOut(
        store_name=store.name,
        store_slug=store.slug,
        order_id=order.id,
        status=order.status.value if hasattr(order.status, "value") else str(order.status),
        created_at=order.created_at,
        customer_note=order.customer_note,
        contact_name=order.contact_name,
        contact_phone=order.contact_phone,
        delivery_address=order.delivery_address,
        delivery_option_id=order.delivery_option_id,
        payment_method_id=order.payment_method_id,
        lines=lines_out,
        total=_money_str(total),
        print_config=effective_print_config(store),
    )


def get_order_print_for_store(db: Session, current: User, order_id: UUID) -> OrderPrintOut:
    order = load_order_detail(db, order_id, current.store_id)
    store = db.get(Store, current.store_id)
    assert store is not None
    return build_order_print_out(db, store, order)
