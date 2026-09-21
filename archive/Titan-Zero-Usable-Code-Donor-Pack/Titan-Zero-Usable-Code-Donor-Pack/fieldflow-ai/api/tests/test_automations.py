import pytest
from fastapi.testclient import TestClient

from api.app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_healthy_equipment_requires_no_action(client):
    response = client.post(
        "/api/automations/evaluate/FF-BC-1007"
    )

    assert response.status_code == 200

    result = response.json()

    assert result["outcome"] == "no_action"
    assert result["service_case_id"] is None
    assert result["telemetry"]["health_status"] == "operational"


def test_critical_automation_prevents_duplicate_cases(client):
    first_response = client.post(
        "/api/automations/evaluate/FF-TR-3018"
    )
    second_response = client.post(
        "/api/automations/evaluate/FF-TR-3018"
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200

    first_result = first_response.json()
    second_result = second_response.json()

    assert first_result["outcome"] in {
        "service_case_created",
        "duplicate_prevented",
    }
    assert second_result["outcome"] == "duplicate_prevented"
    assert second_result["service_case_id"] == first_result["service_case_id"]


def test_unknown_equipment_automation_returns_404(client):
    response = client.post(
        "/api/automations/evaluate/FF-UNKNOWN"
    )

    assert response.status_code == 404