"""Contratos: health global/v1 e autenticação (registo, login, refresh)."""

import uuid

import pytest
from fastapi.testclient import TestClient


def test_root_health_200(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_api_v1_health_200(client: TestClient) -> None:
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"store_name": "L", "store_slug": "ab"},
        {"store_name": "L", "store_slug": "ab", "admin_email": "x@y.com"},
        {"store_name": "L", "store_slug": "ab", "password": "12345678"},
    ],
)
def test_register_422_missing_or_incomplete_body(client: TestClient, payload: dict) -> None:
    r = client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 422
    assert "detail" in r.json()


def test_register_422_password_too_short(client: TestClient) -> None:
    r = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja",
            "store_slug": "ab",
            "admin_email": "a@b.co",
            "password": "short",
        },
    )
    assert r.status_code == 422


def test_register_422_slug_invalid_format(client: TestClient) -> None:
    r = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja",
            "store_slug": "Slug_Maiusculo",
            "admin_email": "a@b.co",
            "password": "12345678",
        },
    )
    assert r.status_code == 422


def test_register_422_slug_too_short(client: TestClient) -> None:
    r = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja",
            "store_slug": "a",
            "admin_email": "a@b.co",
            "password": "12345678",
        },
    )
    assert r.status_code == 422


def test_register_409_duplicate_email(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    body = {
        "store_name": "L1",
        "store_slug": f"d1-{suffix}",
        "admin_email": f"dup-{suffix}@example.com",
        "password": "12345678",
    }
    assert client.post("/api/v1/auth/register", json=body).status_code == 201
    body2 = {**body, "store_slug": f"d2-{suffix}"}
    r = client.post("/api/v1/auth/register", json=body2)
    assert r.status_code == 409
    assert "já em uso" in r.json()["detail"]


def test_login_401_wrong_password(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "L",
            "store_slug": f"lg-{suffix}",
            "admin_email": f"lg-{suffix}@example.com",
            "password": "12345678",
        },
    )
    r = client.post(
        "/api/v1/auth/login",
        data={"username": f"lg-{suffix}@example.com", "password": "outra-palavra"},
    )
    assert r.status_code == 401


def test_login_422_not_form(client: TestClient) -> None:
    r = client.post("/api/v1/auth/login", json={"username": "a@b.co", "password": "x"})
    assert r.status_code == 422


def test_refresh_422_short_token(client: TestClient) -> None:
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": "curto"})
    assert r.status_code == 422


def test_refresh_401_invalid_token(client: TestClient) -> None:
    r = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "0123456789-invalid-token-please"},
    )
    assert r.status_code == 401
