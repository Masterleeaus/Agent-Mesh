import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_technician, CreateTechnicianInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock(return_value={"id": "tech-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_technician_successfully(mock_pod):
    data = CreateTechnicianInput(name="Bob Smith")
    result = await create_technician(MagicMock(), data)
    assert result.status == "success"
    assert result.technician_id == "tech-1"
    mock_pod.records.create.assert_called()
    create_call = mock_pod.records.create.call_args_list[0]
    assert create_call[0][0] == "technicians"
    assert create_call[0][1]["name"] == "Bob Smith"
    assert create_call[0][1]["availability"] == "available"
    assert create_call[0][1]["status"] == "active"


@pytest.mark.asyncio
async def test_returns_error_when_name_empty(mock_pod):
    data = CreateTechnicianInput(name="")
    result = await create_technician(MagicMock(), data)
    assert result.status == "error"
    assert "name is required" in result.error.lower()


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.create.side_effect = Exception("DB timeout")
    data = CreateTechnicianInput(name="Bob Smith")
    result = await create_technician(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
