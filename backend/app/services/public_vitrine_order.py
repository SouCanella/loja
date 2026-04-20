"""Criação de pedido a partir da vitrine (IP-11, MVP)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.api.handlers import public_catalog as public_handlers
from app.core.config import get_settings
from app.core.public_order_rate_limit import register_public_order_attempt
from app.models.customer import Customer
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.store import Store
from app.schemas.public_vitrine_order import PublicOrderCreate
from app.services.order_line_items import get_product_for_order_line
from app.services.store_notifications import add_new_vitrine_order_notification


def order_short_code(order_id: UUID) -> str:
    return str(order_id).replace("-", "")[:8].upper()


def create_order_from_vitrine(
    db: Session,
    store: Store,
    body: PublicOrderCreate,
    *,
    customer: Customer | None,
    client_ip: str,
) -> Order:
    if body.website and str(body.website).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pedido inválido",
        )

    settings = get_settings()
    rate_key = f"{client_ip}|{store.id}"
    register_public_order_attempt(
        rate_key,
        max_attempts=settings.public_order_rate_limit_max_attempts,
        window_seconds=settings.public_order_rate_limit_window_seconds,
    )

    d_ok, p_ok = public_handlers.allowed_delivery_and_payment_ids(store)
    if body.delivery_option_id not in d_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Modo de recebimento inválido",
        )
    if body.payment_method_id not in p_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forma de pagamento inválida",
        )

    if customer is not None and customer.store_id != store.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta não pertence a esta loja",
        )

    if body.delivery_option_id != "retirada":
        if not body.delivery_address or not str(body.delivery_address).strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Endereço obrigatório para esta forma de entrega",
            )

    note = body.customer_note.strip() if body.customer_note else None

    order = Order(
        store_id=store.id,
        status=OrderStatus.aguardando_confirmacao,
        customer_note=note,
        source="vitrine",
        customer_id=customer.id if customer else None,
        contact_name=body.customer_name.strip(),
        contact_phone=body.customer_phone.strip(),
        delivery_option_id=body.delivery_option_id,
        payment_method_id=body.payment_method_id,
        delivery_address=body.delivery_address.strip() if body.delivery_address else None,
        stock_committed=False,
    )

    for line in body.items:
        p = get_product_for_order_line(
            db,
            product_id=line.product_id,
            store_id=store.id,
            reject_catalog_unavailable=True,
        )
        order.items.append(
            OrderItem(
                product_id=p.id,
                quantity=line.quantity,
                unit_price=p.price,
            )
        )

    db.add(order)
    db.flush()
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=None,
            to_status=OrderStatus.aguardando_confirmacao.value,
            user_id=None,
        )
    )
    add_new_vitrine_order_notification(db, order)
    db.commit()
    db.refresh(order)
    return order
