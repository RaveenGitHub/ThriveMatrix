import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_user_can_register_and_login() -> None:
    email = f"user-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    assert register_response.status_code == 201
    payload = register_response.json()
    assert payload["user"]["email"] == email
    assert payload["user"]["role"] == "user"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert login_response.status_code == 200
    tokens = login_response.json()
    assert tokens["access_token"]
    assert tokens["refresh_token"]


def test_invalid_credentials_are_rejected() -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nope@example.com", "password": "wrongpass"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_protected_route_requires_access_token() -> None:
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing or invalid access token"


def test_access_token_allows_user_profile_fetch() -> None:
    email = f"profile-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == email
    assert me_response.json()["role"] == "user"


def test_user_can_manage_profile_preferences() -> None:
    email = f"prefs-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    access_token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["access_token"]

    updated = client.put(
        "/api/v1/auth/preferences",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"theme": "dark", "currency": "INR", "email_notifications": True},
    )
    assert updated.status_code == 200
    assert updated.json()["theme"] == "dark"
    assert updated.json()["currency"] == "INR"

    fetched = client.get(
        "/api/v1/auth/preferences",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert fetched.status_code == 200
    assert fetched.json()["email_notifications"] is True


def test_user_cannot_access_admin_route() -> None:
    email = f"user-admin-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = login_response.json()["access_token"]

    admin_response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert admin_response.status_code == 403
    assert admin_response.json()["detail"] == "Forbidden"


def test_admin_can_access_admin_route() -> None:
    email = f"admin-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "admin"},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = login_response.json()["access_token"]

    admin_response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert admin_response.status_code == 200
    assert admin_response.json()["users"]


def test_authorization_failures_are_audited() -> None:
    email = f"audit-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = login_response.json()["access_token"]

    client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    audit_response = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert audit_response.status_code == 403
    admin_email = f"admin-{uuid.uuid4()}@example.com"
    admin_password = "StrongPass!123"
    client.post(
        "/api/v1/auth/register",
        json={"email": admin_email, "password": admin_password, "role": "admin"},
    )
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": admin_password},
    )
    admin_token = admin_login.json()["access_token"]

    admin_logs = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert admin_logs.status_code == 200
    assert any(
        event["event"] == "auth.denied" or event["event"] == "authorization.denied"
        for event in admin_logs.json()["events"]
    )


def test_audit_records_capture_change_context() -> None:
    email = f"audit-trace-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["access_token"]

    client.post(
        "/api/v1/goals",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Emergency cushion",
            "category": "safety",
            "target_amount": 25000,
            "target_currency": "INR",
            "target_date": "2027-12-31",
            "status": "active",
            "priority": "high",
        },
    )

    admin_email = f"audit-admin-{uuid.uuid4()}@example.com"
    admin_password = "StrongPass!123"
    client.post(
        "/api/v1/auth/register",
        json={"email": admin_email, "password": admin_password, "role": "admin"},
    )
    admin_token = client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": admin_password},
    ).json()["access_token"]

    logs = client.get(
        "/api/v1/audit/logs",
        headers={"Authorization": f"Bearer {admin_token}"},
    ).json()["events"]

    goal_event = next(
        (
            event
            for event in reversed(logs)
            if event.get("event") == "goal.created" and event.get("actor") == email
        ),
        None,
    )
    assert goal_event is not None
    assert goal_event["actor"] == email
    assert goal_event["resource"].startswith("goal:")
    assert "correlation_id" in goal_event and bool(goal_event["correlation_id"])
    assert "before" in goal_event and "after" in goal_event
    assert "reason" in goal_event and bool(goal_event["reason"])
    assert "timestamp" in goal_event and bool(goal_event["timestamp"])
