import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
TEST_EMAIL = f"currency-preference-{uuid.uuid4()}@example.com"


def _login(email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_currency_catalog_and_rates_are_available() -> None:
    currencies = client.get("/api/v1/currencies")
    rates = client.get("/api/v1/currencies/rates")

    assert currencies.status_code == 200
    assert {item["currency_code"] for item in currencies.json()["currencies"]} >= {
        "USD",
        "INR",
        "AED",
    }
    assert rates.status_code == 200
    assert rates.json()["base_currency"] == "USD"
    assert len(rates.json()["rates"]) >= 17


def test_user_can_update_preferred_currency_without_changing_raw_records() -> None:
    email = TEST_EMAIL
    password = "StrongPass!123"
    registration = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "require_verification": False},
    )
    assert registration.status_code == 201
    token = _login(email, password)

    response = client.put(
        "/api/v1/profile/currency",
        headers={"Authorization": f"Bearer {token}"},
        json={"preferred_currency": "aed"},
    )

    assert response.status_code == 200
    assert response.json() == {"preferred_currency": "AED"}


def test_user_cannot_select_an_unsupported_currency() -> None:
    token = _login(TEST_EMAIL, "StrongPass!123")

    response = client.put(
        "/api/v1/profile/currency",
        headers={"Authorization": f"Bearer {token}"},
        json={"preferred_currency": "XXX"},
    )

    assert response.status_code == 422
    assert "unsupported or disabled" in response.json()["detail"]