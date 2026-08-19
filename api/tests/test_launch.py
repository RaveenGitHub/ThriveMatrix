from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_launch_governance_reports_release_readiness() -> None:
    response = client.get("/api/v1/launch/governance")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ready", "pending"}
    assert "checklist" in body
    assert "signoffs" in body
    assert body["checklist"][0]["id"] == "G1"
    assert body["signoffs"]["product"] in {"approved", "pending"}
