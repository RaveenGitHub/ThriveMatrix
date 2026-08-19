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


def test_user_can_upload_and_review_transaction_batch() -> None:
    email = f"tx-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/transactions/import",
        json={
            "source_name": "HDFC Bank",
            "records": [
                {"date": "2026-08-01", "description": "Salary", "amount": 85000, "type": "credit"},
                {"date": "2026-08-02", "description": "Groceries", "amount": 3500, "type": "debit"},
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["owner_email"] == email
    assert payload["record_count"] == 2

    review = client.get(
        "/api/v1/transactions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert review.status_code == 200
    assert len(review.json()["transactions"]) == 2


def test_transaction_amounts_and_types_are_validated() -> None:
    email = f"tx-invalid-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/transactions/import",
        json={
            "source_name": "Test Bank",
            "records": [{"date": "2026-08-01", "description": "Bad", "amount": 0, "type": "unknown"}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422


def test_users_only_see_their_own_transactions() -> None:
    alice = f"alice-{uuid.uuid4()}@example.com"
    bob = f"bob-{uuid.uuid4()}@example.com"

    alice_token = _register_and_login(alice)
    bob_token = _register_and_login(bob)

    client.post(
        "/api/v1/transactions/import",
        json={
            "source_name": "Alice Bank",
            "records": [{"date": "2026-08-01", "description": "Salary", "amount": 60000, "type": "credit"}],
        },
        headers={"Authorization": f"Bearer {alice_token}"},
    )

    bob_list = client.get(
        "/api/v1/transactions",
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert bob_list.status_code == 200
    assert all(item["owner_email"] == bob for item in bob_list.json()["transactions"])
