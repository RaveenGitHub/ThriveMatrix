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


def test_user_can_create_and_list_goals() -> None:
    email = f"goals-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == 201

    token = _login(email, password)

    response = client.post(
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

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Emergency Fund"
    assert payload["owner_email"] == email

    list_response = client.get(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert list_response.status_code == 200
    assert len(list_response.json()["goals"]) >= 1


def test_goal_amount_must_be_positive() -> None:
    email = f"goals-invalid-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    token = _login(email, password)

    response = client.post(
        "/api/v1/goals",
        json={
            "name": "Bad Goal",
            "category": "safety",
            "target_amount": 0,
            "target_currency": "INR",
            "target_date": "2027-12-31",
            "status": "active",
            "priority": "medium",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_users_only_see_their_own_goals() -> None:
    alice = f"alice-{uuid.uuid4()}@example.com"
    bob = f"bob-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post("/api/v1/auth/register", json={"email": alice, "password": password})
    client.post("/api/v1/auth/register", json={"email": bob, "password": password})

    alice_token = _login(alice, password)
    bob_token = _login(bob, password)

    goal_response = client.post(
        "/api/v1/goals",
        json={
            "name": "Alice Goal",
            "category": "safety",
            "target_amount": 25000,
            "target_currency": "INR",
            "target_date": "2027-06-30",
            "status": "active",
            "priority": "low",
        },
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert goal_response.status_code == 201

    bob_list = client.get("/api/v1/goals", headers={"Authorization": f"Bearer {bob_token}"})
    assert bob_list.status_code == 200
    assert all(goal["owner_email"] == bob for goal in bob_list.json()["goals"])
