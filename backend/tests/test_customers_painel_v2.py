"""Contas de cliente na vitrine — painel (GET/POST /api/v2/customers)."""

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def test_customers_list_empty_then_create(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    empty = client.get("/api/v2/customers", headers=h)
    assert empty.status_code == 200, empty.text
    assert empty.json()["success"] is True
    assert empty.json()["data"] == []

    r = client.post(
        "/api/v2/customers",
        headers=h,
        json={"email": "cli@example.com", "password": "senha-8-chars"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["success"] is True
    assert body["data"]["email"] == "cli@example.com"

    listed = client.get("/api/v2/customers", headers=h)
    assert listed.status_code == 200
    rows = listed.json()["data"]
    assert len(rows) == 1
    assert rows[0]["email"] == "cli@example.com"


def test_customers_duplicate_email_409(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    client.post(
        "/api/v2/customers",
        headers=h,
        json={"email": "dup@example.com", "password": "senha-8-chars"},
    )
    r2 = client.post(
        "/api/v2/customers",
        headers=h,
        json={"email": "dup@example.com", "password": "outra-senha-8"},
    )
    assert r2.status_code == 409
