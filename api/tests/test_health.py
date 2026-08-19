from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_liveness_returns_ok() -> None:
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_runtime_contract_exposes_finance_conventions() -> None:
    response = client.get("/api/v1/runtime")

    assert response.status_code == 200
    assert response.json()["currencies"] == ["INR", "USD"]
    assert response.json()["fx_policy"] == "manual-valuation"


def test_readiness_does_not_advertise_unconfigured_dependencies() -> None:
    response = client.get("/health/ready")

    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"