from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_release_runbook_reports_rollback_and_support_steps() -> None:
    response = client.get("/api/v1/release/runbook")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "pending"}
    assert "rollback" in body
    assert "support" in body
    assert body["rollback"][0]["step"]
    assert body["support"]["escalation"]
