"""Rótulos de contacto para clientes com ou sem e-mail na vitrine."""

from uuid import UUID

from app.models.customer import Customer


def order_contact_snapshot(customer: Customer) -> tuple[str | None, str | None]:
    """Nome e telefone para copiar para o pedido (contact_name / telefone ou e-mail como nome)."""
    name = customer.contact_name.strip() if customer.contact_name else None
    if not name and customer.email:
        name = customer.email.strip()
    phone = customer.phone.strip() if customer.phone else None
    return name, phone


def contact_display_label(
    *,
    customer_id: UUID,
    email: str | None,
    contact_name: str | None,
    phone: str | None,
) -> str:
    em = (email or "").strip()
    if em:
        return em
    parts = [p.strip() for p in [contact_name or "", phone or ""] if p and p.strip()]
    return " · ".join(parts) if parts else str(customer_id)
