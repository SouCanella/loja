"""POST /api/v2/orders — cliente existente ou novo contacto (painel)."""

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def test_create_order_with_new_customer(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        headers=h,
        json={
            "name": "Bolo OC",
            "price": "15.00",
            "inventory": {"unit": "un", "initial_quantity": "5", "unit_cost": "6.00"},
        },
    )
    assert pr.status_code == 201, pr.text
    pid = pr.json()["id"]

    r = client.post(
        "/api/v2/orders",
        headers={**h, "Idempotency-Key": "k-new-cust-1"},
        json={
            "items": [{"product_id": pid, "quantity": "1"}],
            "new_customer": {
                "contact_name": "Maria",
                "phone": "11988887777",
                "email": "maria@example.com",
            },
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()["data"]
    assert data["source"] == "painel"
    assert data["customer_id"] is not None
    assert data["contact_name"] == "Maria"
    assert data["contact_phone"] == "11988887777"

    listed = client.get("/api/v2/customers", headers=h).json()["data"]
    assert len(listed) == 1
    assert listed[0]["contact_name"] == "Maria"


def test_create_order_with_existing_customer_id(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        headers=h,
        json={
            "name": "Tarte",
            "price": "20.00",
            "inventory": {"unit": "un", "initial_quantity": "3", "unit_cost": "8.00"},
        },
    )
    assert pr.status_code == 201
    pid = pr.json()["id"]

    cr = client.post(
        "/api/v2/customers",
        headers=h,
        json={"contact_name": "João", "phone": "11777776666"},
    )
    assert cr.status_code == 201
    cid = cr.json()["data"]["id"]

    r = client.post(
        "/api/v2/orders",
        headers={**h, "Idempotency-Key": "k-exist-1"},
        json={
            "items": [{"product_id": pid, "quantity": "2"}],
            "customer_id": cid,
        },
    )
    assert r.status_code == 201, r.text
    data = r.json()["data"]
    assert data["customer_id"] == cid
    assert data["contact_name"] == "João"
    assert data["contact_phone"] == "11777776666"


def test_create_order_customer_both_422(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        headers=h,
        json={
            "name": "P",
            "price": "1.00",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "0.50"},
        },
    )
    pid = pr.json()["id"]
    cr = client.post(
        "/api/v2/customers",
        headers=h,
        json={"contact_name": "X", "phone": "11666665555"},
    )
    cid = cr.json()["data"]["id"]

    r = client.post(
        "/api/v2/orders",
        headers=h,
        json={
            "items": [{"product_id": pid, "quantity": "1"}],
            "customer_id": cid,
            "new_customer": {"contact_name": "Y", "phone": "11555554444"},
        },
    )
    assert r.status_code == 422
