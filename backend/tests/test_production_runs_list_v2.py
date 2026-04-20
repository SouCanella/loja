"""GET /api/v2/production-runs — listagem de corridas (Fase 3.1)."""

from datetime import date

from fastapi.testclient import TestClient


def test_production_runs_list_empty(client: TestClient, auth_headers: dict) -> None:
    r = client.get("/api/v2/production-runs", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert body["data"] == []


def test_production_runs_list_with_date_filter(client: TestClient, auth_headers: dict) -> None:
    r = client.get(
        "/api/v2/production-runs?date_from=2026-01-01&date_to=2026-01-31&limit=10",
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_production_runs_rejects_bad_limit(client: TestClient, auth_headers: dict) -> None:
    r = client.get("/api/v2/production-runs?limit=9999", headers=auth_headers)
    assert r.status_code == 422
