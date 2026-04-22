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
        json={
            "contact_name": "Cliente Teste",
            "phone": "11999999999",
            "email": "cli@example.com",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["success"] is True
    assert body["data"]["source"] == "painel_manual"
    assert body["data"]["contact_name"] == "Cliente Teste"
    assert body["data"]["phone"] == "11999999999"
    assert body["data"]["email"] == "cli@example.com"
    assert body["data"]["has_vitrine_login"] is False

    listed = client.get("/api/v2/customers", headers=h)
    assert listed.status_code == 200
    rows = listed.json()["data"]
    assert len(rows) == 1
    assert rows[0]["email"] == "cli@example.com"


def test_customers_create_without_email_201(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    r = client.post(
        "/api/v2/customers",
        headers=h,
        json={"contact_name": "Só nome", "phone": "11777777777"},
    )
    assert r.status_code == 201, r.text
    d = r.json()["data"]
    assert d["email"] is None
    assert d["source"] == "painel_manual"
    assert d["has_vitrine_login"] is False


def test_customers_duplicate_email_409(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    client.post(
        "/api/v2/customers",
        headers=h,
        json={"contact_name": "A", "phone": "11888888881", "email": "dup@example.com"},
    )
    r2 = client.post(
        "/api/v2/customers",
        headers=h,
        json={"contact_name": "B", "phone": "11888888882", "email": "dup@example.com"},
    )
    assert r2.status_code == 409
