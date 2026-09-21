import pytest
from unittest.mock import MagicMock, patch
from src.handler import accept_appointment, AcceptAppointmentInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "apt-1", "technician_id": "tech-1", "status": "scheduled"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_accepts_appointment_successfully(mock_pod):
    data = AcceptAppointmentInput(appointment_id="apt-1", technician_id="tech-1", technician_name="Bob")
    result = await accept_appointment(MagicMock(), data)
    assert result.status == "success"
    assert result.appointment_id == "apt-1"
    assert result.technician_id == "tech-1"
    mock_pod.records.update.assert_called_once_with("appointments", "apt-1", {"status": "accepted"})
    mock_pod.records.create.assert_called_once()


@pytest.mark.asyncio
async def test_returns_not_found_when_appointment_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = AcceptAppointmentInput(appointment_id="missing", technician_id="tech-1", technician_name="Bob")
    result = await accept_appointment(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_returns_error_when_no_technician_assigned(mock_pod):
    mock_pod.records.get.return_value = {"id": "apt-1", "technician_id": None, "status": "scheduled"}
    data = AcceptAppointmentInput(appointment_id="apt-1", technician_id="tech-1", technician_name="Bob")
    result = await accept_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "no technician assigned" in result.error.lower()


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = AcceptAppointmentInput(appointment_id="apt-1", technician_id="tech-1", technician_name="Bob")
    result = await accept_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
