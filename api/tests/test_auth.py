import hashlib
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import _ACCESS_TOKENS, _REFRESH_TOKENS, _SESSION_TOKENS, _USERS, _cleanup_expired_sessions, _hash_token_value, _utc_now, app

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


def test_account_locks_after_repeated_failed_login_attempts() -> None:
    email = f"lockout-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    for _ in range(4):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrongpass"},
        )
        assert response.status_code == 401

    throttled_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpass"},
    )
    assert throttled_response.status_code == 429
    assert throttled_response.json()["detail"] == "Too many login attempts"

    for _ in range(5):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrongpass"},
        )
        if response.status_code == 423:
            break

    assert response.status_code == 423
    assert response.json()["detail"] == "Account locked"
    assert _USERS[email]["status"] == "locked"

    locked_login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert locked_login_response.status_code == 423
    assert locked_login_response.json()["detail"] == "Account locked"


def test_login_rate_limit_rejects_excessive_failed_attempts() -> None:
    email = f"ratelimit-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    for _ in range(4):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrongpass"},
        )
        assert response.status_code == 401

    rate_limited = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "wrongpass"},
    )

    assert rate_limited.status_code == 429
    assert rate_limited.json()["detail"] == "Too many login attempts"


def test_admin_can_reset_a_locked_account() -> None:
    user_email = f"unlock-{uuid.uuid4()}@example.com"
    user_password = "StrongPass!123"
    admin_email = f"unlock-admin-{uuid.uuid4()}@example.com"
    admin_password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": user_email, "password": user_password},
    )
    client.post(
        "/api/v1/auth/register",
        json={"email": admin_email, "password": admin_password, "role": "admin"},
    )

    for _ in range(10):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": user_email, "password": "wrongpass"},
        )
        if response.status_code == 423:
            break

    assert _USERS[user_email]["status"] == "locked"

    admin_token = client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": admin_password},
    ).json()["access_token"]

    unlock_response = client.post(
        f"/api/v1/admin/users/{user_email}/unlock",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert unlock_response.status_code == 200
    assert unlock_response.json()["status"] == "unlocked"
    assert _USERS[user_email]["status"] == "active"
    assert _USERS[user_email]["failed_login_attempts"] == 0

    successful_login = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": user_password},
    )
    assert successful_login.status_code == 200
    assert successful_login.json()["access_token"]


def test_expired_sessions_are_pruned_from_memory_and_store() -> None:
    expired_email = f"expired-session-{uuid.uuid4()}@example.com"
    expired_access = "expired-access-token"
    expired_refresh = "expired-refresh-token"
    expired_access_expires = (_utc_now() - timedelta(minutes=5)).isoformat()
    expired_refresh_expires = (_utc_now() - timedelta(minutes=5)).isoformat()

    _ACCESS_TOKENS[expired_access] = {
        "email": expired_email,
        "role": "user",
        "expires_at": expired_access_expires,
        "session_closed": False,
    }
    _SESSION_TOKENS[expired_access] = {
        "email": expired_email,
        "role": "user",
        "expires_at": expired_access_expires,
        "terminated": False,
    }
    _REFRESH_TOKENS[_hash_token_value(expired_refresh)] = {
        "email": expired_email,
        "role": "user",
        "expires_at": expired_refresh_expires,
    }

    _cleanup_expired_sessions()

    assert expired_access not in _ACCESS_TOKENS
    assert expired_access not in _SESSION_TOKENS
    assert _hash_token_value(expired_refresh) not in _REFRESH_TOKENS


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


def test_username_registration_requires_verification_before_login() -> None:
    email = f"otp-{uuid.uuid4()}@example.com"
    username = f"user_{uuid.uuid4().hex[:8]}"
    password = "StrongPass!123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Aarav Nair",
            "email": email,
            "username": username,
            "password": password,
            "preferred_currency": "INR",
            "require_verification": True,
        },
    )

    assert register_response.status_code == 201
    payload = register_response.json()
    assert payload["verification_required"] is True
    assert payload["otp_code"]

    unverified_login = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert unverified_login.status_code == 401

    verify_response = client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "otp": payload["otp_code"]},
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["verified"] is True

    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200
    assert login_response.json()["access_token"]


def test_phone_or_email_registration_is_allowed_and_login_accepts_username_or_email() -> None:
    phone = f"9{uuid.uuid4().int % 10000000000:010d}"
    username = f"mobile_{uuid.uuid4().hex[:8]}"
    password = "StrongPass!123"

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Meera Kulkarni",
            "phone": phone,
            "username": username,
            "password": password,
            "preferred_currency": "INR",
            "require_verification": False,
        },
    )

    assert register_response.status_code == 201
    assert register_response.json()["user"]["username"] == username

    login_response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200
    assert login_response.json()["access_token"]


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


def test_protected_routes_reject_unauthenticated_access() -> None:
    response = client.get("/api/v1/auth/session-status")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing or invalid access token"


def test_login_sets_secure_session_cookies_and_cookie_auth_works() -> None:
    email = f"cookie-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )

    assert login_response.status_code == 200
    assert login_response.cookies.get("tm_access_token")
    assert login_response.cookies.get("tm_refresh_token")

    cookie_session = client.get(
        "/api/v1/auth/session-status",
        cookies={
            "tm_access_token": login_response.cookies["tm_access_token"],
            "tm_refresh_token": login_response.cookies["tm_refresh_token"],
        },
    )

    assert cookie_session.status_code == 200
    assert cookie_session.json()["email"] == email


def test_session_termination_invalidates_access_after_logout() -> None:
    email = f"session-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    access_token = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["access_token"]

    logout_response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_response.status_code == 200

    status_response = client.get(
        "/api/v1/auth/session-status",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert status_response.status_code == 401


def test_refresh_rotation_invalidates_the_previous_access_token() -> None:
    email = f"refresh-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    first_access_token = login_response.json()["access_token"]
    refresh_token_value = login_response.json()["refresh_token"]

    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_value},
    )
    assert refresh_response.status_code == 200
    refreshed_tokens = refresh_response.json()
    assert refreshed_tokens["access_token"] != first_access_token

    old_access_response = client.get(
        "/api/v1/auth/session-status",
        headers={"Authorization": f"Bearer {first_access_token}"},
    )
    assert old_access_response.status_code == 401
    assert old_access_response.json()["detail"] == "Missing or invalid access token"


def test_refresh_tokens_are_hashed_before_storage() -> None:
    email = f"hashed-refresh-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    refresh_token_value = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["refresh_token"]

    assert refresh_token_value not in _REFRESH_TOKENS
    assert hashlib.sha256(refresh_token_value.encode("utf-8")).hexdigest() in _REFRESH_TOKENS


def test_new_login_invalidates_any_previous_active_session_for_the_same_user() -> None:
    email = f"single-session-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    first_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    first_token = first_login.json()["access_token"]

    second_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert second_login.status_code == 200
    second_token = second_login.json()["access_token"]
    assert second_token != first_token

    first_session = client.get(
        "/api/v1/auth/session-status",
        headers={"Authorization": f"Bearer {first_token}"},
    )
    assert first_session.status_code == 401


def test_reused_refresh_token_is_rejected() -> None:
    email = f"replay-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    refresh_token_value = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()["refresh_token"]

    first_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_value},
    )
    assert first_refresh.status_code == 200

    second_refresh = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token_value},
    )
    assert second_refresh.status_code == 401
    assert second_refresh.json()["detail"] == "Invalid refresh token"


def test_session_records_are_persisted_in_sqlite_store() -> None:
    email = f"sqlite-session-{uuid.uuid4()}@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    result = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert result.status_code == 200

    db_path = Path(__file__).resolve().parents[1] / "data" / "thrivematrix_sessions.db"
    assert db_path.exists()

    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            "SELECT user_email, role FROM auth_sessions WHERE user_email = ?",
            (email,),
        ).fetchall()

    assert rows
    assert rows[0][0] == email


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
