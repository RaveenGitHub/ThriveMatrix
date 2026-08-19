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
