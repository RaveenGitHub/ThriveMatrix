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


def test_user_can_update_and_archive_goals_and_view_progress() -> None:
    email = f"goal-lifecycle-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    token = _login(email, password)

    created = client.post(
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
    goal_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/goals/{goal_id}",
        json={
            "name": "Emergency Fund 2027",
            "target_amount": 150000,
            "priority": "medium",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Emergency Fund 2027"
    assert updated.json()["target_amount"] == 150000

    progress = client.get(
        f"/api/v1/goals/{goal_id}/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert progress.status_code == 200
    assert progress.json()["percent_complete"] == 0
    assert progress.json()["remaining_amount"] == 150000

    archived = client.delete(
        f"/api/v1/goals/{goal_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"

    list_response = client.get(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert list_response.status_code == 200
    assert all(goal["status"] != "archived" for goal in list_response.json()["goals"])


def test_goal_progress_is_based_on_linked_investments_and_underfunded_alerts() -> None:
    email = f"goal-progress-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    token = _login(email, password)

    goal = client.post(
        "/api/v1/goals",
        json={
            "name": "Home Renovation",
            "category": "safety",
            "target_amount": 120000,
            "target_currency": "INR",
            "target_date": "2028-12-31",
            "status": "active",
            "priority": "high",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    goal_id = goal.json()["id"]

    client.post(
        "/api/v1/investments",
        json={
            "name": "Goal linked investment",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 30000,
            "units": 10,
            "unit_value": 4500,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
            "goal_id": goal_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    client.post(
        "/api/v1/investments",
        json={
            "name": "Unrelated investment",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 50000,
            "units": 20,
            "unit_value": 3000,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    progress = client.get(
        f"/api/v1/goals/{goal_id}/progress",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert progress.status_code == 200
    assert progress.json()["current_amount"] == 45000
    assert progress.json()["percent_complete"] == 37.5
    assert progress.json()["remaining_amount"] == 75000
    assert progress.json()["funding_gap"] == 75000

    alerts = client.get(
        "/api/v1/alerts",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert alerts.status_code == 200
    assert any(alert["type"] == "goal_underfunded" for alert in alerts.json()["alerts"])


def test_goal_validation_rejects_invalid_dates_and_enums() -> None:
    email = f"goal-validation-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    token = _login(email, password)

    invalid_date = client.post(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Broken Goal",
            "category": "safety",
            "target_amount": 20000,
            "target_currency": "INR",
            "target_date": "not-a-date",
            "status": "active",
            "priority": "medium",
        },
    )
    assert invalid_date.status_code == 422

    invalid_enum = client.post(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Broken Status",
            "category": "safety",
            "target_amount": 20000,
            "target_currency": "INR",
            "target_date": "2027-12-31",
            "status": "invalid-status",
            "priority": "medium",
        },
    )
    assert invalid_enum.status_code == 422


def test_users_cannot_update_or_delete_other_users_goals() -> None:
    alice = f"alice-goal-{uuid.uuid4()}@example.com"
    bob = f"bob-goal-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post("/api/v1/auth/register", json={"email": alice, "password": password})
    client.post("/api/v1/auth/register", json={"email": bob, "password": password})
    alice_token = _login(alice, password)
    bob_token = _login(bob, password)

    created = client.post(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {alice_token}"},
        json={
            "name": "Alice Goal",
            "category": "safety",
            "target_amount": 10000,
            "target_currency": "INR",
            "target_date": "2027-01-10",
            "status": "active",
            "priority": "low",
        },
    )
    goal_id = created.json()["id"]

    forbidden_update = client.put(
        f"/api/v1/goals/{goal_id}",
        headers={"Authorization": f"Bearer {bob_token}"},
        json={"name": "Bob Modified Goal"},
    )
    assert forbidden_update.status_code == 404

    forbidden_delete = client.delete(
        f"/api/v1/goals/{goal_id}",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert forbidden_delete.status_code == 404
