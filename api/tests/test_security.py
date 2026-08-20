from pathlib import Path

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
    assert response.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"
    assert "content-security-policy" in response.headers
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]


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


def test_runtime_config_endpoint_redacts_sensitive_values() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    response = client.get("/api/v1/config")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "misconfigured"
    assert "APP_SECRET" in body["missing"]
    assert "DATABASE_URL" in body["missing"]
    assert body["redacted"]["APP_SECRET"] == "[REDACTED]"
    assert body["redacted"]["DATABASE_URL"] == "[REDACTED]"


def test_local_runtime_manifest_includes_api_and_web_services() -> None:
    compose_file = Path(__file__).resolve().parents[2] / "docker-compose.yml"
    compose_text = compose_file.read_text(encoding="utf-8")

    assert "services:" in compose_text
    assert "api:" in compose_text
    assert "web:" in compose_text
    assert "healthcheck:" in compose_text
