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


def test_domain_summary_exposes_ready_status_for_life_domains() -> None:
    email = f"domains-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/domains/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "partial"}
    assert "domains" in body
    assert "health" in body["domains"]
    assert "legal" in body["domains"]
    assert "relationships" in body["domains"]
    assert "readiness" in body["domains"]
