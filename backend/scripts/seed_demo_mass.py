#!/usr/bin/env python3
"""
Massa de demonstração (~30 dias) para testes manuais do painel e vitrine.

Requisitos:
  - API FastAPI a correr (ex.: make dev ou docker compose).
  - DATABASE_URL válido (mesmo .env que a API) para ajustar datas históricas.
  - Loja vazia: se já existirem produtos, o script aborta (evita duplicar dados).

Uso (na pasta backend, com .venv):
  SEED_API_URL=http://127.0.0.1:8000 python scripts/seed_demo_mass.py

Documentação: doc/execucao/seed-demo-massa.md
"""

from __future__ import annotations

import os
import random
import sys
import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

import httpx

# Permite importar app.* quando executado de backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


DAYS = 30
STORE_SLUG = os.environ.get("SEED_STORE_SLUG", "loja-demo-massa")
STORE_NAME = os.environ.get("SEED_STORE_NAME", "Doce Massa Demo")
# Domínio .local é rejeitado pelo validador de email (Pydantic) — usar TLD válido para demo.
ADMIN_EMAIL = os.environ.get("SEED_ADMIN_EMAIL", "admin@demo-massa.example.com")
ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "DemoMassa#2026")
API_BASE = os.environ.get("SEED_API_URL", "http://127.0.0.1:8000").rstrip("/")


@dataclass
class Ingredient:
    name: str
    unit: str
    qty: str
    cost: str


@dataclass
class ProductSpec:
    name: str
    slug_cat: str
    price: str
    initial_stock: str
    unit_cost: str
    recipe: list[tuple[str, str]] | None  # (ingredient_name, qty per yield)


INGREDIENTS: list[Ingredient] = [
    Ingredient("Farinha T55", "kg", "500", "4.50"),
    Ingredient("Açúcar refinado", "kg", "400", "3.20"),
    Ingredient("Ovos (unid.)", "un", "2000", "0.65"),
    Ingredient("Chocolate meio-amargo", "kg", "80", "38.00"),
    Ingredient("Queijo minas", "kg", "60", "22.00"),
    Ingredient("Leite integral", "L", "300", "4.80"),
]

PRODUCTS: list[ProductSpec] = [
    ProductSpec(
        "Bolo de chocolate",
        "doces",
        "89.90",
        "8000",
        "28.00",
        [
            ("Farinha T55", "0.4"),
            ("Açúcar refinado", "0.3"),
            ("Ovos (unid.)", "8"),
            ("Chocolate meio-amargo", "0.35"),
        ],
    ),
    ProductSpec(
        "Torta de queijo",
        "doces",
        "72.00",
        "8000",
        "24.00",
        [
            ("Farinha T55", "0.25"),
            ("Queijo minas", "0.5"),
            ("Ovos (unid.)", "6"),
            ("Leite integral", "0.2"),
        ],
    ),
    ProductSpec(
        "Cupcake sortido (6)",
        "doces",
        "48.00",
        "8000",
        "15.00",
        [
            ("Farinha T55", "0.15"),
            ("Açúcar refinado", "0.12"),
            ("Ovos (unid.)", "4"),
            ("Leite integral", "0.1"),
        ],
    ),
    ProductSpec(
        "Pão de queijo (20 un.)",
        "salgados",
        "32.00",
        "8000",
        "10.00",
        [
            ("Farinha T55", "0.2"),
            ("Queijo minas", "0.4"),
            ("Leite integral", "0.15"),
            ("Ovos (unid.)", "3"),
        ],
    ),
    ProductSpec(
        "Quiche individual",
        "salgados",
        "28.00",
        "8000",
        "11.00",
        [("Farinha T55", "0.12"), ("Ovos (unid.)", "2"), ("Queijo minas", "0.15")],
    ),
    ProductSpec(
        "Brownie (bandeja)",
        "doces",
        "42.00",
        "8000",
        "13.00",
        [
            ("Farinha T55", "0.18"),
            ("Chocolate meio-amargo", "0.22"),
            ("Ovos (unid.)", "4"),
            ("Açúcar refinado", "0.15"),
        ],
    ),
    ProductSpec(
        "Refrigerante lata",
        "bebidas",
        "6.50",
        "8000",
        "3.20",
        None,
    ),
]


def _v1(path: str) -> str:
    return f"{API_BASE}/api/v1{path}"


def register_or_login(client: httpx.Client) -> str:
    reg = client.post(
        _v1("/auth/register"),
        json={
            "store_name": STORE_NAME,
            "store_slug": STORE_SLUG,
            "admin_email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
        },
    )
    if reg.status_code == 201:
        return reg.json()["access_token"]
    if reg.status_code in (400, 409):
        login = client.post(
            _v1("/auth/login"),
            data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        if login.status_code != 200:
            sys.stderr.write(f"Login falhou: {login.status_code} {login.text}\n")
            sys.exit(1)
        return login.json()["access_token"]
    sys.stderr.write(f"Registo falhou: {reg.status_code} {reg.text}\n")
    sys.exit(1)


def ensure_empty_catalog(client: httpx.Client, h: dict[str, str]) -> None:
    pr = client.get(_v1("/products"), headers=h)
    if pr.status_code != 200:
        sys.stderr.write(f"GET /products: {pr.status_code}\n")
        sys.exit(1)
    if len(pr.json()) > 0:
        sys.stderr.write(
            "Já existem produtos nesta loja. Apague a loja ou use outro slug via "
            "SEED_STORE_SLUG / conta SEED_ADMIN_EMAIL.\n"
        )
        sys.exit(2)


def post_json(client: httpx.Client, h: dict[str, str], path: str, body: dict) -> dict[str, Any]:
    r = client.post(_v1(path), headers=h, json=body)
    if r.status_code not in (200, 201):
        sys.stderr.write(f"POST {path} -> {r.status_code} {r.text}\n")
        sys.exit(1)
    return r.json()


def patch_json(client: httpx.Client, h: dict[str, str], path: str, body: dict) -> dict[str, Any]:
    r = client.patch(_v1(path), headers=h, json=body)
    if r.status_code != 200:
        sys.stderr.write(f"PATCH {path} -> {r.status_code} {r.text}\n")
        sys.exit(1)
    return r.json()


def build_catalog(
    client: httpx.Client, h: dict[str, str]
) -> tuple[dict[str, UUID], dict[str, UUID], dict[str, UUID]]:
    ing_ids: dict[str, UUID] = {}
    for ing in INGREDIENTS:
        out = post_json(
            client,
            h,
            "/inventory-items",
            {
                "name": ing.name,
                "unit": ing.unit,
                "initial_batch": {"quantity": ing.qty, "unit_cost": ing.cost},
            },
        )
        ing_ids[ing.name] = UUID(out["id"])

    cats: dict[str, UUID] = {}
    for name, slug in [("Doces", "doces"), ("Salgados", "salgados"), ("Bebidas", "bebidas")]:
        c = post_json(client, h, "/categories", {"name": name, "slug": slug})
        cats[slug] = UUID(c["id"])

    prod_ids: dict[str, UUID] = {}
    recipe_ids: dict[str, UUID] = {}
    for ps in PRODUCTS:
        cid = cats[ps.slug_cat]
        p = post_json(
            client,
            h,
            "/products",
            {
                "name": ps.name,
                "price": ps.price,
                "category_id": str(cid),
                "inventory": {
                    "unit": "un",
                    "initial_quantity": ps.initial_stock,
                    "unit_cost": ps.unit_cost,
                },
            },
        )
        pid = UUID(p["id"])
        prod_ids[ps.name] = pid
        if ps.recipe:
            items = [{"inventory_item_id": str(ing_ids[n]), "quantity": q} for n, q in ps.recipe]
            rc = post_json(
                client,
                h,
                "/recipes",
                {
                    "product_id": str(pid),
                    "yield_quantity": "12",
                    "time_minutes": 45,
                    "items": items,
                },
            )
            recipe_ids[ps.name] = UUID(rc["id"])

    return ing_ids, prod_ids, recipe_ids


def random_status_weights() -> str:
    r = random.random()
    if r < 0.52:
        return "entregue"
    if r < 0.70:
        return "confirmado"
    if r < 0.82:
        return "aguardando_confirmacao"
    if r < 0.90:
        return "pronto"
    if r < 0.96:
        return "em_producao"
    return "saiu_entrega"


def spread_datetimes(n: int, days: int) -> list[datetime]:
    """Distribui `n` instantes ao longo de `days` (UTC), horas ~9–20."""
    out: list[datetime] = []
    today = date.today()
    start = datetime(today.year, today.month, today.day, tzinfo=UTC) - timedelta(days=days - 1)
    for _ in range(n):
        d = random.randint(0, days - 1)
        hour = random.randint(9, 20)
        minute = random.randint(0, 59)
        out.append(start + timedelta(days=d, hours=hour, minutes=minute))
    out.sort()
    return out


def run_simulation(
    client: httpx.Client,
    h: dict[str, str],
    prod_ids: dict[str, UUID],
    recipe_ids: dict[str, UUID],
) -> tuple[list[tuple[UUID, datetime]], list[tuple[UUID, datetime]]]:
    product_names = list(prod_ids.keys())
    all_order_times = spread_datetimes(187, DAYS)
    cancel_times = all_order_times[:12]
    revenue_times = all_order_times[12:]
    prod_slots = spread_datetimes(38, DAYS)

    order_backdate: list[tuple[UUID, datetime]] = []
    prod_backdate: list[tuple[UUID, datetime]] = []

    # Pedidos cancelados sem receita (rascunho -> cancelado)
    for ts in cancel_times:
        pname = random.choice(product_names)
        pid = prod_ids[pname]
        o = post_json(
            client,
            h,
            "/orders",
            {
                "items": [{"product_id": str(pid), "quantity": str(random.randint(1, 3))}],
                "customer_note": "Pedido de teste — cancelado",
            },
        )
        oid = UUID(o["id"])
        patch_json(client, h, f"/orders/{oid}/status", {"status": "cancelado"})
        order_backdate.append((oid, ts))

    # Pedidos com receita
    for ts_slot in revenue_times:
        pname = random.choice(product_names)
        pid = prod_ids[pname]
        qty = random.randint(1, 5)
        o = post_json(
            client,
            h,
            "/orders",
            {
                "items": [{"product_id": str(pid), "quantity": str(qty)}],
                "customer_note": "Pedido demo massa",
            },
        )
        oid = UUID(o["id"])
        st = random_status_weights()
        patch_json(client, h, f"/orders/{oid}/status", {"status": st})
        order_backdate.append((oid, ts_slot))

    # Produções
    rec_names = [n for n in recipe_ids]
    for i, ts_slot in enumerate(prod_slots):
        rname = random.choice(rec_names)
        rid = recipe_ids[rname]
        key = f"demo-prod-{uuid.uuid4().hex[:12]}-{i}"
        pr = client.post(
            _v1("/production"),
            headers={**h, "Idempotency-Key": key},
            json={"recipe_id": str(rid)},
        )
        if pr.status_code != 201:
            sys.stderr.write(f"POST /production: {pr.status_code} {pr.text}\n")
            sys.exit(1)
        prod_backdate.append((UUID(pr.json()["id"]), ts_slot))

    return order_backdate, prod_backdate


def apply_backdates(
    order_rows: list[tuple[UUID, datetime]],
    prod_rows: list[tuple[UUID, datetime]],
) -> None:
    from app.db.session import SessionLocal
    from app.models.order import Order, OrderStatusHistory, StockMovement
    from app.models.production_run import ProductionRun
    from sqlalchemy import select, update

    db = SessionLocal()
    try:
        for oid, ts in order_rows:
            db.execute(update(Order).where(Order.id == oid).values(created_at=ts))
            db.execute(
                update(OrderStatusHistory)
                .where(OrderStatusHistory.order_id == oid)
                .values(created_at=ts)
            )
            db.execute(
                update(StockMovement).where(StockMovement.order_id == oid).values(created_at=ts)
            )

        for prid, ts in prod_rows:
            db.execute(update(ProductionRun).where(ProductionRun.id == prid).values(created_at=ts))
            sm_ids = list(
                db.scalars(select(StockMovement.id).where(StockMovement.production_run_id == prid))
            )
            for smid in sm_ids:
                db.execute(
                    update(StockMovement).where(StockMovement.id == smid).values(created_at=ts)
                )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    random.seed(42)
    print(f"API: {API_BASE} | loja: {STORE_SLUG} | admin: {ADMIN_EMAIL}")
    try:
        httpx.get(f"{API_BASE}/health", timeout=5.0)
    except httpx.ConnectError:
        sys.stderr.write(
            f"Não foi possível ligar à API em {API_BASE}. "
            "Suba o backend (ex.: make dev ou docker compose up) e volte a executar.\n"
        )
        sys.exit(1)
    with httpx.Client(timeout=120.0) as client:
        token = register_or_login(client)
        h = {"Authorization": f"Bearer {token}"}
        ensure_empty_catalog(client, h)
        print("A criar insumos, categorias, produtos e receitas…")
        _, prod_ids, recipe_ids = build_catalog(client, h)
        print("A gerar pedidos e produções (pode demorar ~1–2 min)…")
        order_rows, prod_rows = run_simulation(client, h, prod_ids, recipe_ids)
        print("A ajustar datas na base de dados (30 dias)…")
        apply_backdates(order_rows, prod_rows)

    print("Concluído.")
    print(f"  Vitrine: /loja/{STORE_SLUG}")
    print(f"  Painel: login com {ADMIN_EMAIL} / (password em SEED_ADMIN_PASSWORD)")
    print("  Relatório: últimos 30 dias deve mostrar receita, categorias e estados.")


if __name__ == "__main__":
    main()
