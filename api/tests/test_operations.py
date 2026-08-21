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


def test_operations_summary_reports_status_and_dependencies() -> None:
    email = f"ops-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/operations/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded", "partial"}
    assert "dependencies" in body
    assert "metrics" in body
    assert body["metrics"]["audit_event_count"] >= 0
    assert body["metrics"]["user_count"] >= 1


def test_operations_telemetry_exposes_logs_metrics_traces_and_slos() -> None:
    email = f"ops-telemetry-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/operations/telemetry",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert "logs" in body
    assert "metrics" in body
    assert "traces" in body
    assert "slos" in body
    assert "alerts" in body
    assert body["metrics"]["api_error_rate"] >= 0
    assert any(item["service"] == "api" for item in body["alerts"])
    assert body["logs"][0]["message"]


def test_operations_recovery_reports_rto_rpo_failover_and_runbook() -> None:
    email = f"ops-recovery-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/operations/recovery",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "degraded"}
    assert body["rto_minutes"] > 0
    assert body["rpo_minutes"] >= 0
    assert "failover" in body
    assert "dlq" in body
    assert "graceful_degradation" in body
    assert "runbook" in body
    assert body["runbook"][0]["step"]


def test_operations_security_review_reports_findings_and_release_gate() -> None:
    email = f"ops-security-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/operations/security-review",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "blocked"}
    assert "checks" in body
    assert "findings" in body
    assert "release_gate" in body
    assert body["release_gate"]["blocking"] in {True, False}
    assert any(item["name"] == "authorization_review" for item in body["checks"])
    assert body["checks"][0]["name"]


def test_operations_status_report_tracks_uptime_error_budget_and_incident_state() -> None:
    email = f"ops-status-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/operations/status",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"normal", "degraded", "incident"}
    assert body["uptime_pct"] >= 0
    assert body["error_budget_pct"] >= 0
    assert "incidents" in body
    assert "alerts" in body
    assert body["alerts"][0]["severity"]
