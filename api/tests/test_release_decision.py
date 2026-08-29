from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_release_decision_reports_known_limitations_and_signoff_status() -> None:
    response = client.get("/api/v1/release/decision")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "pending", "blocked"}
    assert "known_limitations" in body
    assert "signoff_status" in body
    assert "pending_decisions" in body
    assert body["signoff_status"]["product"] in {"approved", "pending"}
    assert {item["id"] for item in body["pending_decisions"]} == {
        "D-01",
        "D-02",
        "D-03",
        "D-04",
    }
