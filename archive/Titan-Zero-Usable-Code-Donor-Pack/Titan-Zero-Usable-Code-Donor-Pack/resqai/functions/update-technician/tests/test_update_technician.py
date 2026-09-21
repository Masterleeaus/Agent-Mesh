import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_technician, UpdateTechnicianInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tech-1", "name": "Bob", "status": "active"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_technician_successfully(mock_pod):
    data = UpdateTechnicianInput(technician_id="tech-1", name="Bob Smith", primary_phone="555-0100")
    result = await update_technician(MagicMock(), data)
    assert result.status == "success"
    assert result.technician_id == "tech-1"
    mock_pod.records.update.assert_called_once_with(
        "technicians", "tech-1", {"name": "Bob Smith", "primary_phone": "555-0100"}
    )
    mock_pod.records.create.assert_called_once()


@pytest.mark.asyncio
async def test_returns_not_found_when_technician_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateTechnicianInput(technician_id="missing")
    result = await update_technician(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_skips_update_when_no_fields_provided(mock_pod):
    data = UpdateTechnicianInput(technician_id="tech-1")
    result = await update_technician(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.update.assert_not_called()
    mock_pod.records.create.assert_called_once()


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = UpdateTechnicianInput(technician_id="tech-1", name="New Name")
    result = await update_technician(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
