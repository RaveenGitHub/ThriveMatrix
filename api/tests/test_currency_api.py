import uuid

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
TEST_EMAIL = f"currency-preference-{uuid.uuid4()}@example.com"
CUSTOM_LETTERS = "".join(character for character in uuid.uuid4().hex.upper() if character.isalpha())
CUSTOM_CODE = "X" + CUSTOM_LETTERS[:2]


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


def test_admin_can_manage_currency_and_update_rates() -> None:
    admin_token = _login("admin@ravthijo.com", "AdminRavthijo01!")
    headers = {"Authorization": f"Bearer {admin_token}"}

    created = client.post(
        "/api/v1/admin/currencies",
        headers=headers,
        json={
            "currency_code": CUSTOM_CODE,
            "currency_name": "Test Currency",
            "decimal_places": 2,
            "usd_per_unit": "0.5",
        },
    )
    assert created.status_code == 201
    assert created.json()["currency_code"] == CUSTOM_CODE

    updated = client.put(
        f"/api/v1/admin/currencies/{CUSTOM_CODE}",
        headers=headers,
        json={"usd_per_unit": "0.75", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["usd_per_unit"] == "0.75"
    assert not updated.json()["is_active"]

    bulk = client.put(
        "/api/v1/admin/currencies/rates/bulk",
        headers=headers,
        json={"rates": {CUSTOM_CODE: "0.8", "USD": "1"}},
    )
    assert bulk.status_code == 200
    assert CUSTOM_CODE in bulk.json()["updated"]

    audit = client.get("/api/v1/admin/currencies/audit", headers=headers)
    assert audit.status_code == 200
    assert any(event["event"] == "currency.created" for event in audit.json()["events"])


def test_regular_user_cannot_manage_currencies() -> None:
    token = _login(TEST_EMAIL, "StrongPass!123")

    response = client.get(
        "/api/v1/admin/currencies",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403