from app.main import redact_sensitive_fields, validate_runtime_config


def test_security_headers_are_present() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_sensitive_fields_are_redacted() -> None:
    payload = {
        "email": "user@example.com",
        "password": "super-secret",
        "access_token": "abc123",
        "nested": {"refresh_token": "token-xyz"},
        "safe": "ok",
    }

    redacted = redact_sensitive_fields(payload)

    assert redacted["email"] == "user@example.com"
    assert redacted["password"] == "[REDACTED]"
    assert redacted["access_token"] == "[REDACTED]"
    assert redacted["nested"]["refresh_token"] == "[REDACTED]"
    assert redacted["safe"] == "ok"


def test_runtime_configuration_fails_closed_on_missing_secrets() -> None:
    missing = validate_runtime_config({"APP_ENV": "local"})

    assert "APP_SECRET" in missing
    assert "DATABASE_URL" in missing
