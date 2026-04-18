"""Contratos da API pública (vitrine)."""

import uuid

from fastapi.testclient import TestClient


def test_public_store_404_unknown_slug(client: TestClient) -> None:
    r = client.get(f"/api/v1/public/stores/{uuid.uuid4().hex[:12]}")
    assert r.status_code == 404


def test_public_products_404_unknown_slug(client: TestClient) -> None:
    r = client.get(f"/api/v1/public/stores/{uuid.uuid4().hex[:12]}/products")
    assert r.status_code == 404
