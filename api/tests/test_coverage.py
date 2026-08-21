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


def test_user_can_get_coverage_score() -> None:
    email = f"coverage-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Health Secure",
            "policy_type": "health",
            "premium_amount": 1200,
            "coverage_amount": 500000,
            "start_date": "2026-08-19",
            "end_date": "2027-08-18",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get(
        "/api/v1/insurance/coverage-score",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["score"] >= 0
    assert body["score"] <= 100
    assert body["provider"] == "basic-vision-v1"


def test_user_gets_explainable_coverage_gap_details() -> None:
    email = f"coverage-gap-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.get(
        "/api/v1/insurance/coverage-score",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 0
    assert body["provider"] == "basic-vision-v1"
    assert isinstance(body["coverage_gaps"], list)
    assert any(item["type"] == "missing_policies" for item in body["coverage_gaps"])
    assert body["score_components"]["version"] == "basic-vision-v1"


def test_dashboard_summary_includes_insurance_count_and_coverage_score() -> None:
    email = f"dashboard-insurance-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    client.post(
        "/api/v1/insurance/policies",
        json={
            "name": "Life Secure",
            "policy_type": "life",
            "premium_amount": 2500,
            "coverage_amount": 750000,
            "start_date": "2026-08-19",
            "end_date": "2027-08-18",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    response = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["insurance_count"] == 1
    assert body["coverage_score"] >= 0
    assert body["coverage_score"] <= 100
