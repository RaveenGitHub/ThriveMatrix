from fastapi.testclient import TestClient

from app.main import (
    classify_sensitive_data,
    decrypt_backup_payload,
    encrypt_backup_payload,
    export_user_data,
    handle_account_deletion,
    redact_sensitive_config,
)
from app.main import app

client = TestClient(app)


def test_user_can_export_data_and_delete_their_account_via_api() -> None:
    email = "privacy-user@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    tokens = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()
    access_token = tokens["access_token"]

    export_response = client.get(
        "/api/v1/privacy/export",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert export_response.status_code == 200
    assert export_response.json()["email"] == email

    delete_response = client.post(
        "/api/v1/privacy/delete-account",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert delete_response.status_code == 200
    assert delete_response.json()["status"] == "deleted"
    assert delete_response.json()["deletion_review_required"] is True


def test_user_can_manage_privacy_consents() -> None:
    email = "consent-user@example.com"
    password = "StrongPass!123"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    tokens = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    ).json()
    access_token = tokens["access_token"]

    set_response = client.post(
        "/api/v1/privacy/consents",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"marketing": True, "analytics": False, "data_export": True},
    )
    assert set_response.status_code == 200
    body = set_response.json()
    assert body["marketing"] is True
    assert body["analytics"] is False

    list_response = client.get(
        "/api/v1/privacy/consents",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["marketing"] is True
    assert list_response.json()["data_export"] is True


def test_sensitive_data_is_classified_for_privacy_control() -> None:
    profile = {
        "email": "user@example.com",
        "name": "Asha",
        "bank_account": "123456789",
        "notes": "Safe note",
    }

    classified = classify_sensitive_data(profile)

    assert classified["email"] == "personal"
    assert classified["bank_account"] == "financial"
    assert classified["notes"] == "low"


def test_data_export_returns_serializable_user_snapshot() -> None:
    snapshot = export_user_data({
        "email": "user@example.com",
        "role": "user",
        "profile": {"name": "Asha"},
    })

    assert snapshot["email"] == "user@example.com"
    assert snapshot["profile"]["name"] == "Asha"
    assert "exported_at" in snapshot


def test_account_deletion_marks_user_as_deleted() -> None:
    state = {"email": "user@example.com", "status": "active"}
    result = handle_account_deletion(state)

    assert result["status"] == "deleted"
    assert result["deletion_review_required"] is True


def test_sensitive_config_values_are_redacted() -> None:
    config = {
        "APP_ENV": "local",
        "APP_SECRET": "super-secret-key",
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db",
    }

    redacted = redact_sensitive_config(config)

    assert redacted["APP_SECRET"] == "[REDACTED]"
    assert redacted["DATABASE_URL"] == "[REDACTED]"
    assert redacted["APP_ENV"] == "local"


def test_encrypted_backup_round_trips_without_losing_data() -> None:
    payload = {"email": "user@example.com", "role": "user", "notes": "backup data"}
    encrypted = encrypt_backup_payload(payload, "backup-key-123")
    restored = decrypt_backup_payload(encrypted, "backup-key-123")

    assert restored == payload
    assert encrypted != payload
