import pytest
from unittest.mock import MagicMock, patch
from src.handler import complete_appointment, CompleteAppointmentInput
from src.models import PartUsed


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "apt-1", "status": "accepted"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_completes_appointment_successfully(mock_pod):
    data = CompleteAppointmentInput(appointment_id="apt-1", completed_by="tech-1", work_summary="Fixed leak")
    result = await complete_appointment(MagicMock(), data)
    assert result.status == "success"
    assert result.appointment_id == "apt-1"
    mock_pod.records.update.assert_called_once()
    update_args = mock_pod.records.update.call_args[0]
    assert update_args[0] == "appointments"
    assert update_args[1] == "apt-1"
    assert update_args[2]["status"] == "completed"
    assert "completed_at" in update_args[2]
    assert update_args[2]["work_summary"] == "Fixed leak"
    mock_pod.records.create.assert_called_once()


@pytest.mark.asyncio
async def test_returns_not_found_when_appointment_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = CompleteAppointmentInput(appointment_id="missing", completed_by="tech-1")
    result = await complete_appointment(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_returns_error_when_already_completed(mock_pod):
    mock_pod.records.get.return_value = {"id": "apt-1", "status": "completed"}
    data = CompleteAppointmentInput(appointment_id="apt-1", completed_by="tech-1")
    result = await complete_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "already completed" in result.error.lower()


@pytest.mark.asyncio
async def test_creates_inventory_transactions_for_parts(mock_pod):
    parts = [PartUsed(part_name="Pipe", quantity=2, part_number="P-123")]
    data = CompleteAppointmentInput(appointment_id="apt-1", completed_by="tech-1", parts_used=parts)
    result = await complete_appointment(MagicMock(), data)
    assert result.status == "success"
    inventory_calls = [c for c in mock_pod.records.create.call_args_list if c[0][0] == "inventory_transactions"]
    assert len(inventory_calls) == 1
    assert inventory_calls[0][0][1]["part_name"] == "Pipe"
    assert inventory_calls[0][0][1]["quantity"] == 2


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = CompleteAppointmentInput(appointment_id="apt-1", completed_by="tech-1")
    result = await complete_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
