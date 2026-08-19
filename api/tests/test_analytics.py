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


def test_user_can_create_and_list_analytics_snapshots() -> None:
    email = f"analytics-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/analytics/snapshots",
        json={
            "period": "2026-08",
            "net_worth": 150000,
            "goal_total": 100000,
            "expense_total": 40000,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["owner_email"] == email
    assert payload["period"] == "2026-08"

    list_response = client.get(
        "/api/v1/analytics/snapshots",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["snapshots"]) >= 1


def test_insights_are_explainable_and_not_financial_advice() -> None:
    email = f"insights-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/analytics/insights",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["insights"]) >= 1
    assert all(item["advice"] is False for item in payload["insights"])
    assert all("source" in item and "rationale" in item for item in payload["insights"])
