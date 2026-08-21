import uuid
from datetime import date, timedelta

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


def test_user_can_create_and_list_insurance_policies() -> None:
    email = f"insurance-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Health Secure",
            "policy_type": "health",
            "premium_amount": 1200,
            "coverage_amount": 500000,
            "start_date": "2026-08-19",
            "end_date": "2027-08-18",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["owner_email"] == email
    assert payload["policy_type"] == "health"

    list_response = client.get(
        "/api/v1/insurance/policies",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["policies"]) >= 1


def test_insurance_amounts_and_dates_are_validated() -> None:
    email = f"insurance-invalid-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Bad Policy",
            "policy_type": "auto",
            "premium_amount": 0,
            "coverage_amount": -10,
            "start_date": "2026-08-19",
            "end_date": "2026-08-18",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_users_only_see_their_own_policies() -> None:
    alice = f"alice-insurance-{uuid.uuid4()}@example.com"
    bob = f"bob-insurance-{uuid.uuid4()}@example.com"

    alice_token = _register_and_login(alice)
    bob_token = _register_and_login(bob)

    create_response = client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Alice Health",
            "policy_type": "health",
            "premium_amount": 2000,
            "coverage_amount": 750000,
            "start_date": "2026-08-19",
            "end_date": "2027-08-18",
        },
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert create_response.status_code == 201

    bob_list = client.get(
        "/api/v1/insurance/policies",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_list.status_code == 200
    assert all(item["owner_email"] == bob for item in bob_list.json()["policies"])


def test_policy_renewal_reminder_is_exposed_in_alerts() -> None:
    email = f"insurance-renewal-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)
    renewal_date = (date.today() + timedelta(days=7)).isoformat()

    response = client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Renewal Reminder Policy",
            "policy_type": "health",
            "premium_amount": 1800,
            "coverage_amount": 600000,
            "start_date": "2026-01-01",
            "end_date": "2027-12-31",
            "renewal_date": renewal_date,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["renewal_date"] == renewal_date

    alerts_response = client.get(
        "/api/v1/alerts",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert alerts_response.status_code == 200
    assert any(alert["type"] == "policy_renewal_due" for alert in alerts_response.json()["alerts"])
