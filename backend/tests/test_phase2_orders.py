"""Fluxos Fase 2: produto, pedido, confirmação e stock."""

import uuid

from fastapi.testclient import TestClient


def _auth_headers(client: TestClient) -> dict[str, str]:
    suffix = uuid.uuid4().hex[:8]
    email = f"stock-{suffix}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja Stock",
            "store_slug": f"loja-stock-{suffix}",
            "admin_email": email,
            "password": "senha-segura-1",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "senha-segura-1"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_product_order_confirm_cancel_flow(client: TestClient) -> None:
    h = _auth_headers(client)
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Bolo",
            "price": "25.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "10",
                "unit_cost": "10.00",
            },
        },
        headers=h,
    )
    assert pr.status_code == 201
    product_id = pr.json()["id"]

    or_post = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": "2"}]},
        headers=h,
    )
    assert or_post.status_code == 201
    order_id = or_post.json()["id"]
    assert or_post.json()["status"] == "rascunho"

    p1 = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "confirmado"},
        headers=h,
    )
    assert p1.status_code == 200
    assert p1.json()["stock_committed"] is True

    p2 = client.patch(
        f"/api/v1/orders/{order_id}/status",
        json={"status": "cancelado"},
        headers=h,
    )
    assert p2.status_code == 200
    assert p2.json()["stock_committed"] is False


def test_insufficient_stock_on_confirm(client: TestClient) -> None:
    h = _auth_headers(client)
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Torta",
            "price": "30.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "5",
                "unit_cost": "12.00",
            },
        },
        headers=h,
    )
    product_id = pr.json()["id"]

    o1 = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": "4"}]},
        headers=h,
    )
    oid1 = o1.json()["id"]
    assert (
        client.patch(
            f"/api/v1/orders/{oid1}/status",
            json={"status": "confirmado"},
            headers=h,
        ).status_code
        == 200
    )

    o2 = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": "2"}]},
        headers=h,
    )
    oid2 = o2.json()["id"]
    bad = client.patch(
        f"/api/v1/orders/{oid2}/status",
        json={"status": "confirmado"},
        headers=h,
    )
    assert bad.status_code == 400
