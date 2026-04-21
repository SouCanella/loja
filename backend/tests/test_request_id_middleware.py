"""DT-02 — X-Request-Id propagado na resposta."""

from fastapi.testclient import TestClient


def test_health_returns_x_request_id(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert "X-Request-Id" in r.headers
    assert len(r.headers["X-Request-Id"]) >= 8


def test_x_request_id_echo_when_provided(client: TestClient) -> None:
    rid = "custom-req-id-abc"
    r = client.get("/health", headers={"X-Request-Id": rid})
    assert r.headers.get("X-Request-Id") == rid
