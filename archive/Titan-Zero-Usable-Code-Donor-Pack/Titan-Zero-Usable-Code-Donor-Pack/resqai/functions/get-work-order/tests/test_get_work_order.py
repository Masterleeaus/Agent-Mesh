import pytest
from unittest.mock import MagicMock, patch
from src.handler import get_work_order
from src.models import GetWorkOrderInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_work_order_when_found(mock_pod):
    expected = {"work_order_id": "wo-1", "status": "created", "service_description": "Fix sink"}
    mock_pod.records.get.return_value = expected
    data = GetWorkOrderInput(work_order_id="wo-1")
    result = await get_work_order(MagicMock(), data)
    assert result.status == "success"
    assert result.work_order == expected


@pytest.mark.asyncio
async def test_returns_not_found_when_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = GetWorkOrderInput(work_order_id="missing")
    result = await get_work_order(MagicMock(), data)
    assert result.status == "not_found"
    assert result.work_order is None
    assert "not found" in result.error