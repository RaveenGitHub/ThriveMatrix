import os
from pathlib import Path

import pytest

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


def test_runtime_configuration_rejects_sqlite_in_production() -> None:
    missing = validate_runtime_config({
        "APP_ENV": "production",
        "APP_SECRET": "a" * 32,
        "DATABASE_URL": "sqlite:////tmp/thrivematrix.db",
    })

    assert "DATABASE_URL" in missing


def test_runtime_configuration_rejects_unknown_environment_names() -> None:
    missing = validate_runtime_config({
        "APP_ENV": "qa",
        "APP_SECRET": "a" * 32,
        "DATABASE_URL": "mysql+pymysql://thrivematrix:thrivematrix@localhost:3306/thrivematrix",
    })

    assert "APP_ENV" in missing


def test_runtime_environment_loads_repo_dotenv_values(monkeypatch) -> None:
    from app import main as app_main

    repo_root = Path(__file__).resolve().parents[2]
    env_path = repo_root / ".env"
    original_contents = env_path.read_text(encoding="utf-8") if env_path.exists() else None

    try:
        env_path.write_text(
            "APP_ENV=local\nAPP_SECRET=from-dotenv\nDATABASE_URL=mysql+pymysql://thrivematrix:thrivematrix@localhost:3306/thrivematrix\n",
            encoding="utf-8",
        )
        for key in ["APP_ENV", "APP_SECRET", "DATABASE_URL"]:
            monkeypatch.delenv(key, raising=False)
        app_main.load_runtime_environment()
        assert os.environ["APP_ENV"] == "local"
        assert os.environ["APP_SECRET"] == "from-dotenv"
        assert os.environ["DATABASE_URL"].startswith("mysql+pymysql://")
    finally:
        for key in ["APP_ENV", "APP_SECRET", "DATABASE_URL"]:
            monkeypatch.delenv(key, raising=False)
        if original_contents is None:
            if env_path.exists():
                env_path.unlink()
        else:
            env_path.write_text(original_contents, encoding="utf-8")


def test_runtime_config_endpoint_redacts_sensitive_values() -> None:
    from fastapi.testclient import TestClient

    from app.main import app

    client = TestClient(app)
    response = client.get("/api/v1/config")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "misconfigured"}
    assert "APP_SECRET" in body["required_keys"] or "DATABASE_URL" in body["required_keys"]
    if "APP_SECRET" in body.get("missing", []):
        assert body["redacted"]["APP_SECRET"] == "[REDACTED]"
    if "DATABASE_URL" in body.get("missing", []):
        assert body["redacted"]["DATABASE_URL"] == "[REDACTED]"


def test_local_runtime_manifest_includes_api_and_web_services() -> None:
    compose_file = Path(__file__).resolve().parents[2] / "docker-compose.yml"
    compose_text = compose_file.read_text(encoding="utf-8")

    assert "services:" in compose_text
    assert "api:" in compose_text
    assert "web:" in compose_text
    assert "healthcheck:" in compose_text
