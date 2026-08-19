import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _login(email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_user_can_list_goal_and_policy_alerts() -> None:
    email = f"alerts-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    token = _login(email, password)

    client.post(
        "/api/v1/goals",
        json={
            "name": "Emergency Fund",
            "category": "safety",
            "target_amount": 100000,
            "target_currency": "INR",
            "target_date": "2020-01-01",
            "status": "active",
            "priority": "high",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Health Cover",
            "policy_type": "health",
            "premium_amount": 2400,
            "coverage_amount": 500000,
            "start_date": "2024-01-01",
            "end_date": "2024-02-01",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get(
        "/api/v1/alerts",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert "alerts" in body
    assert any(alert["type"] == "goal_overdue" for alert in body["alerts"])
    assert any(alert["type"] == "policy_expiring" for alert in body["alerts"])
