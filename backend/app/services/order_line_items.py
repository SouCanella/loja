"""Validação partilhada de produtos em linhas de pedido (painel + vitrine)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product


def get_product_for_order_line(
    db: Session,
    *,
    product_id: UUID,
    store_id: UUID,
    reject_catalog_unavailable: bool = False,
) -> Product:
    """Carrega o produto e verifica loja/ativo; opcionalmente bloqueia indisponível no catálogo."""
    p = db.get(Product, product_id)
    if p is None or p.store_id != store_id or not p.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produto inválido")
    if reject_catalog_unavailable and (p.catalog_sale_mode or "in_stock") == "unavailable":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produto indisponível")
    return p
