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


def test_user_can_create_and_list_investments() -> None:
    email = f"invest-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
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

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Nifty Index"
    assert payload["owner_email"] == email

    list_response = client.get(
        "/api/v1/investments",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["investments"]) >= 1


def test_investment_amount_and_units_must_be_valid() -> None:
    email = f"invest-invalid-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/investments",
        json={
            "name": "Bad Investment",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": -1,
            "units": 0,
            "unit_value": 0,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_users_only_see_their_own_investments() -> None:
    alice = f"alice-{uuid.uuid4()}@example.com"
    bob = f"bob-{uuid.uuid4()}@example.com"

    alice_token = _register_and_login(alice)
    bob_token = _register_and_login(bob)

    create_response = client.post(
        "/api/v1/investments",
        json={
            "name": "Alice Investment",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 12000,
            "units": 10,
            "unit_value": 1200,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert create_response.status_code == 201

    bob_list = client.get(
        "/api/v1/investments",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_list.status_code == 200
    assert all(item["owner_email"] == bob for item in bob_list.json()["investments"])
