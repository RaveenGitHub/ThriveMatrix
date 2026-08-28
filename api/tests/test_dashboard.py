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
            "category": "emergency_fund",
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
            "asset_class": "equity_stocks",
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


def test_dashboard_metrics_include_version_and_freshness_metadata() -> None:
    email = f"dashboard-metadata-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert "freshness" in body
    assert body["freshness"]["version"] == "dashboard-v1"
    assert body["freshness"]["status"] in {"ready", "partial"}
    assert "metrics" in body
    assert "goals" in body["metrics"]
    assert "source" in body["metrics"]["goals"]


def test_dashboard_tracks_event_outbox_and_replay_status() -> None:
    email = f"dashboard-events-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    client.post(
        "/api/v1/goals",
        json={
            "name": "Emergency Event Goal",
            "category": "emergency_fund",
            "target_amount": 50000,
            "target_currency": "INR",
            "target_date": "2027-12-31",
            "status": "active",
            "priority": "high",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    outbox_response = client.get(
        "/api/v1/events/outbox",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert outbox_response.status_code == 200
    body = outbox_response.json()
    assert any(item["event"] == "goal.created" for item in body["outbox"])

    replay_response = client.post(
        "/api/v1/events/replay",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert replay_response.status_code == 200
    replay_body = replay_response.json()
    assert replay_body["processed_count"] >= 1
    assert any(item["event"] == "goal.created" for item in replay_body["processed"])


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
