from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from api.app.database import SessionLocal
from api.app.database_models import ServiceCaseRecord
from api.app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


def test_get_service_cases(client: TestClient):
    response = client.get("/api/service-cases")
    service_cases = response.json()

    assert response.status_code == 200
    assert len(service_cases) >= 4
    assert "case_id" in service_cases[0]
    assert "equipment_id" in service_cases[0]


def test_filter_open_service_cases(client: TestClient):
    response = client.get(
        "/api/service-cases",
        params={"case_status": "open"},
    )
    service_cases = response.json()

    assert response.status_code == 200
    assert len(service_cases) >= 1
    assert all(
        service_case["status"] == "open"
        for service_case in service_cases
    )


def test_reject_case_for_unknown_equipment(client: TestClient):
    response = client.post(
        "/api/service-cases",
        json={
            "equipment_id": "INVALID-ID",
            "title": "Invalid equipment test",
            "description": (
                "This request should be rejected because the equipment "
                "record does not exist."
            ),
            "priority": "high",
            "source": "manual",
            "assigned_to": None,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Equipment INVALID-ID was not found."
    )


def test_create_service_case(client: TestClient):
    response = client.post(
        "/api/service-cases",
        json={
            "equipment_id": "FF-DD-2041",
            "title": "Automated connectivity investigation",
            "description": (
                "This temporary service case verifies that the API can "
                "create a database-backed record."
            ),
            "priority": "high",
            "source": "automation",
            "assigned_to": "Test Technician",
        },
    )

    assert response.status_code == 201

    created_case = response.json()
    created_case_id = created_case["case_id"]

    assert created_case["equipment_id"] == "FF-DD-2041"
    assert created_case["status"] == "open"
    assert created_case["source"] == "automation"

    with SessionLocal() as database:
        database_case = database.get(
            ServiceCaseRecord,
            created_case_id,
        )

        assert database_case is not None

        database.delete(database_case)
        database.commit()