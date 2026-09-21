import pytest
from fastapi.testclient import TestClient

from api.app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_agent_returns_grounded_equipment_status(client):
    response = client.post(
        "/api/agent/chat",
        json={
            "message": "What is happening with FF-TR-3018?",
            "confirm_action": False,
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["intent"] == "equipment_status"
    assert result["equipment_id"] == "FF-TR-3018"
    assert result["confidence"] >= 0.9
    assert len(result["recommended_actions"]) > 0
    assert len(result["sources"]) == 2


def test_agent_requires_confirmation_before_creating_case(client):
    response = client.post(
        "/api/agent/chat",
        json={
            "message": "Create a service case for FF-DD-2041.",
            "confirm_action": False,
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["requires_confirmation"] is True
    assert result["action_status"] == "confirmation_required"
    assert result["service_case_id"] is None


def test_agent_creates_or_reuses_confirmed_case(client):
    response = client.post(
        "/api/agent/chat",
        json={
            "message": "Create a service case for FF-DD-2041.",
            "confirm_action": True,
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["requires_confirmation"] is False
    assert result["action_status"] in {
        "service_case_created",
        "duplicate_prevented",
    }
    assert result["service_case_id"] is not None


def test_agent_interactions_are_auditable(client):
    response = client.get("/api/agent/interactions")

    assert response.status_code == 200

    interactions = response.json()

    assert len(interactions) > 0
    assert "detected_intent" in interactions[0]
    assert "confidence" in interactions[0]
    assert "action_status" in interactions[0]