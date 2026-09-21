import pytest
from unittest.mock import MagicMock, patch
from src.handler import get_appointment, GetAppointmentInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "apt-1",
            "customer_id": "cust-1",
            "customer_name": "Alice",
            "technician_id": "tech-1",
            "technician_name": "Bob",
            "service_type": "Plumbing",
            "scheduled_date": "2026-07-01T10:00:00",
            "status": "accepted",
            "duration_minutes": 60,
            "notes": "Check valve",
            "work_summary": None,
            "completed_at": None,
            "cancelled_at": None,
            "cancellation_reason": None,
            "customer_signature": None,
            "created_by": "system",
            "created_at": "2026-06-28T12:00:00",
        })
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_gets_appointment_successfully(mock_pod):
    data = GetAppointmentInput(appointment_id="apt-1")
    result = await get_appointment(MagicMock(), data)
    assert result.status == "success"
    assert result.appointment is not None
    assert result.appointment.appointment_id == "apt-1"
    assert result.appointment.customer_name == "Alice"
    assert result.appointment.technician_name == "Bob"
    assert result.appointment.service_type == "Plumbing"
    assert result.appointment.status == "accepted"


@pytest.mark.asyncio
async def test_returns_not_found_when_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = GetAppointmentInput(appointment_id="missing")
    result = await get_appointment(MagicMock(), data)
    assert result.status == "not_found"
    assert result.appointment is None
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = GetAppointmentInput(appointment_id="apt-1")
    result = await get_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
