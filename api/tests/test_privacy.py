from app.main import (
    classify_sensitive_data,
    decrypt_backup_payload,
    encrypt_backup_payload,
    export_user_data,
    handle_account_deletion,
    redact_sensitive_config,
)


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
