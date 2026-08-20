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


def test_goal_linked_investment_reports_current_value_and_gain_loss() -> None:
    email = f"invest-goal-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    goal_response = client.post(
        "/api/v1/goals",
        json={
            "name": "Home Down Payment",
            "category": "safety",
            "target_amount": 500000,
            "target_currency": "INR",
            "target_date": "2028-12-31",
            "status": "active",
            "priority": "high",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert goal_response.status_code == 201
    goal_id = goal_response.json()["id"]

    response = client.post(
        "/api/v1/investments",
        json={
            "name": "Home fund allocation",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 100000,
            "units": 80,
            "unit_value": 1500,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
            "goal_id": goal_id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["goal_id"] == goal_id
    assert payload["current_asset_value"] == 120000.0
    assert payload["gain_loss"] == 20000.0


def test_goal_linked_investment_must_belong_to_same_user() -> None:
    alice = f"alice-invest-goal-{uuid.uuid4()}@example.com"
    bob = f"bob-invest-goal-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post("/api/v1/auth/register", json={"email": alice, "password": password})
    client.post("/api/v1/auth/register", json={"email": bob, "password": password})
    alice_token = _register_and_login(alice, password)
    bob_token = _register_and_login(bob, password)

    alice_goal = client.post(
        "/api/v1/goals",
        json={
            "name": "Alice Home Fund",
            "category": "safety",
            "target_amount": 400000,
            "target_currency": "INR",
            "target_date": "2028-10-31",
            "status": "active",
            "priority": "medium",
        },
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert alice_goal.status_code == 201
    alice_goal_id = alice_goal.json()["id"]

    bob_response = client.post(
        "/api/v1/investments",
        json={
            "name": "Bob linked investment",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 80000,
            "units": 10,
            "unit_value": 9000,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
            "goal_id": alice_goal_id,
        },
        headers={"Authorization": f"Bearer {bob_token}"},
    )

    assert bob_response.status_code == 404


def test_portfolio_summary_and_allocations_reconcile_investment_values() -> None:
    email = f"invest-portfolio-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    client.post(
        "/api/v1/investments",
        json={
            "name": "Nifty Index",
            "asset_class": "equity",
            "currency": "INR",
            "amount_invested": 100000,
            "units": 80,
            "unit_value": 1500,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    client.post(
        "/api/v1/investments",
        json={
            "name": "Debt Fund",
            "asset_class": "debt",
            "currency": "INR",
            "amount_invested": 50000,
            "units": 50,
            "unit_value": 1100,
            "valuation_source": "manual",
            "valuation_timestamp": "2026-08-19T10:00:00Z",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    summary = client.get(
        "/api/v1/investments/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert summary.status_code == 200
    body = summary.json()
    assert body["total_invested"] == 150000
    assert body["current_value"] == 175000
    assert body["gain_loss"] == 25000

    allocations = client.get(
        "/api/v1/investments/allocations",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert allocations.status_code == 200
    allocation_body = allocations.json()["allocations"]
    assert {item["asset_class"]: item["weight_pct"] for item in allocation_body} == {
        "equity": 68.57,
        "debt": 31.43,
    }


def test_duplicate_investment_submissions_are_idempotent() -> None:
    email = f"invest-idempotent-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    payload = {
        "name": "Duplicate fund",
        "asset_class": "equity",
        "currency": "INR",
        "amount_invested": 75000,
        "units": 50,
        "unit_value": 1600,
        "valuation_source": "manual",
        "valuation_timestamp": "2026-08-19T10:00:00Z",
        "idempotency_key": "dup-key-123",
    }

    first = client.post(
        "/api/v1/investments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    second = client.post(
        "/api/v1/investments",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert first.status_code == 201
    assert second.status_code == 200
    assert len(client.get("/api/v1/investments", headers={"Authorization": f"Bearer {token}"}).json()["investments"]) == 1
