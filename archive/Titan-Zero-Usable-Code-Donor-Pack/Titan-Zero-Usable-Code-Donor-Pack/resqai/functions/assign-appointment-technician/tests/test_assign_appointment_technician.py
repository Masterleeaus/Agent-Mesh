import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.handler import assign_appointment_technician, AssignAppointmentTechnicianInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "apt-1", "status": "scheduled"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_assigns_technician_successfully(mock_pod):
    data = AssignAppointmentTechnicianInput(appointment_id="apt-1", technician_name="Bob")
    result = await assign_appointment_technician(MagicMock(), data)
    assert result.status == "success"
    assert result.appointment_id == "apt-1"
    assert result.technician_name == "Bob"
    assert result.audit_logged is True
    mock_pod.records.update.assert_called_once_with("appointments", "apt-1", {"technician_id": None, "status": "in_progress"})
    mock_pod.records.create.assert_called_once()
    log_call = mock_pod.records.create.call_args[0]
    assert log_call[0] == "operations_log"


@pytest.mark.asyncio
async def test_returns_not_found_when_appointment_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = AssignAppointmentTechnicianInput(appointment_id="missing", technician_name="Bob")
    result = await assign_appointment_technician(MagicMock(), data)
    assert result.status == "not_found"
    assert result.audit_logged is False


@pytest.mark.asyncio
async def test_includes_manager_notes_in_audit(mock_pod):
    data = AssignAppointmentTechnicianInput(appointment_id="apt-1", technician_name="Bob", manager_notes="Priority customer")
    result = await assign_appointment_technician(MagicMock(), data)
    assert result.status == "success"
    log_result = mock_pod.records.create.call_args[0][1]["result"]
    assert "manager notes: Priority customer" in log_result


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = AssignAppointmentTechnicianInput(appointment_id="apt-1", technician_name="Bob")
    result = await assign_appointment_technician(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
