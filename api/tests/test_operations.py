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
