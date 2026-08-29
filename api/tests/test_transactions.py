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


def test_transaction_categories_are_validated_against_the_approved_catalog() -> None:
    email = f"tx-catalog-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    valid = client.post(
        "/api/v1/transactions/import",
        json={
            "source_name": "Sample Bank",
            "records": [
                {"date": "2026-08-09", "description": "Grocery top-up", "amount": 1250, "type": "debit", "category": "Grocery"},
                {"date": "2026-08-09", "description": "Salary", "amount": 55000, "type": "credit", "category": "Salary"},
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert valid.status_code == 201
    assert valid.json()["record_count"] == 2

    invalid = client.post(
        "/api/v1/transactions/import",
        json={
            "source_name": "Sample Bank",
            "records": [{"date": "2026-08-09", "description": "Cloud storage", "amount": 199, "type": "debit", "category": "Undefined Category"}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid.status_code == 422

    fetched = client.get(
        "/api/v1/transactions",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert fetched.status_code == 200
    assert any(item["category"] == "Grocery" for item in fetched.json()["transactions"])
    assert any(item["category"] == "Salary" for item in fetched.json()["transactions"])


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


def test_statement_upload_accepts_supported_statement_files_and_quarantines_original() -> None:
    email = f"statement-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/transactions/upload",
        files={"file": ("statement.pdf", b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "application/pdf")},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "validated"
    assert payload["owner_email"] == email
    assert payload["storage"]["private"] is True
    assert payload["storage"]["location"].startswith("quarantine/")
    assert payload["job"]["status"] in {"queued", "validated"}


def test_statement_upload_rejects_unsupported_or_malicious_files() -> None:
    email = f"statement-invalid-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    bad_extension = client.post(
        "/api/v1/transactions/upload",
        files={"file": ("invoice.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert bad_extension.status_code == 400

    malicious_pdf = client.post(
        "/api/v1/transactions/upload",
        files={"file": ("statement.pdf", b"MZ\x90\x00\x03\x00\x00\x00", "application/pdf")},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert malicious_pdf.status_code == 400


def test_transaction_review_normalizes_and_deduplicates_import_rows() -> None:
    email = f"review-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    response = client.post(
        "/api/v1/transactions/review",
        json={
            "source_name": "HDFC Bank",
            "records": [
                {"date": "2026-08-01", "description": "  salary  ", "amount": "85000.00", "type": "credit"},
                {"date": "2026-08-01", "description": "Salary", "amount": 85000, "type": "credit"},
                {"date": "2026-08-02", "description": "Groceries", "amount": "3500.50", "type": "debit"},
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["accepted_count"] == 2
    assert payload["duplicate_count"] == 1
    assert payload["transactions"][0]["description"] == "salary"
    assert payload["transactions"][1]["description"] == "groceries"


def test_transaction_summary_and_category_aggregation_are_available() -> None:
    email = f"summary-{uuid.uuid4()}@example.com"
    token = _register_and_login(email)

    client.post(
        "/api/v1/transactions/import",
        json={
            "source_name": "Sample Bank",
            "records": [
                {"date": "2026-08-01", "description": "Salary", "amount": 85000, "type": "credit"},
                {"date": "2026-08-02", "description": "Freelance project", "amount": 15000, "type": "credit"},
                {"date": "2026-08-03", "description": "Rent", "amount": 22000, "type": "debit"},
                {"date": "2026-08-04", "description": "Groceries", "amount": 3500, "type": "debit"},
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    summary = client.get(
        "/api/v1/transactions/summary",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert summary.status_code == 200
    payload = summary.json()
    assert payload["income_total"] == 100000.0
    assert payload["expense_total"] == 25500.0
    assert payload["net_total"] == 74500.0
    assert payload["savings_rate"] > 0

    categories = client.get(
        "/api/v1/transactions/categories",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert categories.status_code == 200
    category_payload = categories.json()
    assert any(item["category"] == "Salary" for item in category_payload["categories"])
    assert any(item["category"] == "Misc Expense" for item in category_payload["categories"])
