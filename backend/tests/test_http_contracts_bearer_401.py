"""Rotas protegidas devolvem 401 sem Bearer."""

import uuid

import pytest
from fastapi.testclient import TestClient

PROTECTED: list[tuple[str, str]] = [
    ("GET", "/api/v1/me"),
    ("GET", "/api/v1/categories"),
    ("GET", "/api/v1/products"),
    ("GET", "/api/v1/inventory-items"),
    ("GET", "/api/v1/orders"),
    ("GET", "/api/v1/recipes"),
    ("GET", "/api/v1/reports/financial"),
    ("POST", "/api/v1/production"),
    ("GET", "/api/v2/orders"),
    ("GET", "/api/v2/inventory-items"),
    ("GET", "/api/v2/reports/financial"),
]


@pytest.mark.parametrize("method,path", PROTECTED)
def test_requires_bearer_401(client: TestClient, method: str, path: str) -> None:
    kwargs: dict = {}
    if method == "POST" and path == "/api/v1/production":
        kwargs["json"] = {"recipe_id": str(uuid.uuid4())}
    r = client.request(method, path, **kwargs)
    assert r.status_code == 401, f"{method} {path} -> {r.status_code}"
