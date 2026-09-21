import pytest
from unittest.mock import MagicMock, patch
from src.handler import cancel_appointment, CancelAppointmentInput


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
async def test_cancels_appointment_successfully(mock_pod):
    data = CancelAppointmentInput(appointment_id="apt-1", cancellation_reason="Customer unavailable", cancelled_by="dispatcher")
    result = await cancel_appointment(MagicMock(), data)
    assert result.status == "success"
    assert result.appointment_id == "apt-1"
    mock_pod.records.update.assert_called_once()
    update_args = mock_pod.records.update.call_args[0]
    assert update_args[0] == "appointments"
    assert update_args[1] == "apt-1"
    assert update_args[2]["status"] == "cancelled"
    assert update_args[2]["cancellation_reason"] == "Customer unavailable"
    assert "cancelled_at" in update_args[2]
    mock_pod.records.create.assert_called_once()


@pytest.mark.asyncio
async def test_returns_not_found_when_appointment_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = CancelAppointmentInput(appointment_id="missing", cancellation_reason="Reason", cancelled_by="test")
    result = await cancel_appointment(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = CancelAppointmentInput(appointment_id="apt-1", cancellation_reason="Reason", cancelled_by="test")
    result = await cancel_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
