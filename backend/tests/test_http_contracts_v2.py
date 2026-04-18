"""Contratos adicionais /api/v2 (envelope + validação)."""

import pytest
from fastapi.testclient import TestClient


def test_v2_refresh_422_missing_body(client: TestClient) -> None:
    r = client.post("/api/v2/auth/refresh", json={})
    assert r.status_code == 422
    b = r.json()
    assert b.get("success") is False
    assert b.get("errors")


def test_v2_refresh_422_short_token(client: TestClient) -> None:
    r = client.post("/api/v2/auth/refresh", json={"refresh_token": "curto"})
    assert r.status_code == 422
    assert r.json().get("success") is False


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"store_name": "X"},
    ],
)
def test_v2_register_422_invalid_body(client: TestClient, payload: dict) -> None:
    r = client.post("/api/v2/auth/register", json=payload)
    assert r.status_code == 422
    assert r.json().get("success") is False
