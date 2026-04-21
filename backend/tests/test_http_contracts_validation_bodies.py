"""Contratos 422/404 em rotas autenticadas (corpos e parâmetros)."""

import uuid

from fastapi.testclient import TestClient


def test_me_patch_store_pricing_422_negative_margin(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.patch(
        "/api/v1/me/store-pricing",
        headers=auth_headers,
        json={"target_margin_percent": "-1"},
    )
    assert r.status_code == 422


def test_me_patch_store_pricing_422_margin_over_100(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.patch(
        "/api/v1/me/store-pricing",
        headers=auth_headers,
        json={"target_margin_percent": "101"},
    )
    assert r.status_code == 422


def test_me_patch_store_pricing_422_negative_labor_rate(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.patch(
        "/api/v1/me/store-pricing",
        headers=auth_headers,
        json={"labor_rate_per_hour": "-1"},
    )
    assert r.status_code == 422


def test_inventory_post_422_empty_name(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.post(
        "/api/v1/inventory-items",
        headers=auth_headers,
        json={"name": "", "unit": "un"},
    )
    assert r.status_code == 422


def test_inventory_get_by_id_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    rid = uuid.uuid4()
    r = client.get(f"/api/v1/inventory-items/{rid}", headers=auth_headers)
    assert r.status_code == 404


def test_orders_post_422_empty_items(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={"items": []},
    )
    assert r.status_code == 422


def test_categories_post_422_missing_name(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.post(
        "/api/v1/categories",
        headers=auth_headers,
        json={"slug": "doces"},
    )
    assert r.status_code == 422


def test_products_post_422_missing_inventory(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={"name": "P", "price": "10.00"},
    )
    assert r.status_code == 422


def test_recipes_post_422_empty_items(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={
            "product_id": str(uuid.uuid4()),
            "yield_quantity": "1",
            "items": [],
        },
    )
    assert r.status_code == 422


def test_recipes_post_422_invalid_margin(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.post(
        "/api/v1/recipes",
        headers=auth_headers,
        json={
            "product_id": str(uuid.uuid4()),
            "yield_quantity": "1",
            "items": [{"inventory_item_id": str(uuid.uuid4()), "quantity": "1"}],
            "target_margin_percent": "150",
        },
    )
    assert r.status_code == 422


def test_production_post_422_missing_recipe_id(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.post("/api/v1/production", headers=auth_headers, json={})
    assert r.status_code == 422


def test_reports_financial_query_invalid_date_422(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    r = client.get(
        "/api/v1/reports/financial?date_from=nope&date_to=also-bad",
        headers=auth_headers,
    )
    assert r.status_code == 422
