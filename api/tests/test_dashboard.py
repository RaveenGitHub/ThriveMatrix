import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _register_and_login(email: str, password: str = "StrongPass!123") -> str:
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"]


def test_dashboard_exposes_summary_metrics() -> None:
    email = f"dashboard-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    client.post(
        "/api/v1/goals",
        json={
            "name": "Emergency Fund",
            "category": "safety",
            "target_amount": 100000,
            "target_currency": "INR",
            "target_date": "2027-12-31",
            "status": "active",
            "priority": "high",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    client.post(
        "/api/v1/investments",
        json={
            "name": "Nifty Index",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 50000,
            "units": 75,
            "unit_value": 666.67,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["goal_count"] == 1
    assert body["investment_count"] == 1
    assert body["currency"] == "INR"


def test_dashboard_detects_missing_data_without_fabricating_zero() -> None:
    email = f"dashboard-missing-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["goal_count"] == 0
    assert body["investment_count"] == 0
    assert body["status"] == "partial"
