"""MA-01 — reforço de isolamento por loja (pedidos, produtos, impressão, envelope v2)."""

import uuid

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def _product_and_order(client: TestClient, headers: dict[str, str]) -> tuple[str, str]:
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Item B",
            "price": "11.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "3",
                "unit_cost": "5.00",
            },
        },
        headers=headers,
    )
    assert pr.status_code == 201, pr.text
    product_id = pr.json()["id"]
    or_post = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product_id, "quantity": "1"}]},
        headers=headers,
    )
    assert or_post.status_code == 201, or_post.text
    return or_post.json()["id"], product_id


def _store_with_product_and_order(client: TestClient) -> tuple[str, str, dict[str, str]]:
    """Devolve (order_id, product_id, headers) para uma loja com um pedido em rascunho."""
    h = register_random_store(client)["headers"]
    oid, pid = _product_and_order(client, h)
    return oid, pid, h


def test_order_detail_other_store_404_v1(client: TestClient) -> None:
    oid, _, _ = _store_with_product_and_order(client)
    other = register_random_store(client)
    r = client.get(f"/api/v1/orders/{oid}", headers=other["headers"])
    assert r.status_code == 404


def test_order_detail_other_store_404_v2_envelope(client: TestClient) -> None:
    oid, _, _ = _store_with_product_and_order(client)
    other = register_random_store(client)
    r = client.get(f"/api/v2/orders/{oid}", headers=other["headers"])
    assert r.status_code == 404
    body = r.json()
    assert body.get("success") is False
    assert body.get("data") is None


def test_order_status_patch_other_store_404(client: TestClient) -> None:
    oid, _, _ = _store_with_product_and_order(client)
    other = register_random_store(client)
    r = client.patch(
        f"/api/v1/orders/{oid}/status",
        json={"status": "confirmado"},
        headers=other["headers"],
    )
    assert r.status_code == 404


def test_product_get_other_store_404(client: TestClient) -> None:
    _, product_id, _ = _store_with_product_and_order(client)
    other = register_random_store(client)
    r = client.get(f"/api/v1/products/{product_id}", headers=other["headers"])
    assert r.status_code == 404


def test_orders_list_never_includes_other_store(client: TestClient) -> None:
    oid_a, _, h_a = _store_with_product_and_order(client)
    ctx_b = register_random_store(client)
    h_b = ctx_b["headers"]
    oid_b, _ = _product_and_order(client, h_b)

    ids_a = {o["id"] for o in client.get("/api/v1/orders", headers=h_a).json()}
    ids_b = {o["id"] for o in client.get("/api/v1/orders", headers=h_b).json()}

    assert oid_a in ids_a
    assert oid_b in ids_b
    assert oid_a not in ids_b
    assert oid_b not in ids_a


def test_random_order_id_other_store_404(client: TestClient) -> None:
    """UUID inexistente ou de outra loja não deve vazar dados (404 genérico)."""
    other = register_random_store(client)
    fake = str(uuid.uuid4())
    assert client.get(f"/api/v1/orders/{fake}", headers=other["headers"]).status_code == 404
