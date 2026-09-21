from fastapi.testclient import TestClient

from api.app.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_get_all_equipment():
    response = client.get("/api/equipment")
    equipment = response.json()

    assert response.status_code == 200
    assert len(equipment) == 5
    assert equipment[0]["equipment_id"] == "FF-BC-1007"


def test_get_equipment_by_id():
    response = client.get("/api/equipment/FF-DD-2041")
    equipment = response.json()

    assert response.status_code == 200
    assert equipment["location"] == "Denver, Colorado"
    assert equipment["status"] == "warning"


def test_unknown_equipment_returns_404():
    response = client.get("/api/equipment/INVALID-ID")

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Equipment INVALID-ID was not found."
    )


def test_critical_equipment_generates_alerts():
    response = client.get(
        "/api/equipment/FF-TR-3018/telemetry"
    )
    telemetry = response.json()

    assert response.status_code == 200
    assert telemetry["health_status"] == "critical"
    assert len(telemetry["alerts"]) == 3
    assert (
        "Engine temperature exceeds safe operating range."
        in telemetry["alerts"]
    )