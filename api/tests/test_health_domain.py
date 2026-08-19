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


def test_user_can_create_and_list_health_records() -> None:
    email = f"health-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/health/records",
        json={
            "record_type": "checkup",
            "date": "2026-08-19",
            "value": "normal",
            "notes": "Annual checkup completed.",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["owner_email"] == email
    assert payload["record_type"] == "checkup"

    list_response = client.get(
        "/api/v1/health/records",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert len(list_response.json()["records"]) >= 1


def test_users_only_see_their_own_health_records() -> None:
    alice = f"alice-health-{uuid.uuid4()}@example.com"
    bob = f"bob-health-{uuid.uuid4()}@example.com"
    alice_token = _register_and_login(alice)
    bob_token = _register_and_login(bob)

    create_response = client.post(
        "/api/v1/health/records",
        json={
            "record_type": "exercise",
            "date": "2026-08-18",
            "value": "active",
            "notes": "Walked 6 km.",
        },
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert create_response.status_code == 201

    bob_list = client.get(
        "/api/v1/health/records",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_list.status_code == 200
    assert all(item["owner_email"] == bob for item in bob_list.json()["records"])
