import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_work_orders
from src.models import ListWorkOrdersInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_lists_all_work_orders(mock_pod):
    mock_pod.records.list.return_value = [
        {"work_order_id": "wo-1", "appointment_id": "a1", "technician_id": "t1",
         "customer_id": "c1", "status": "created", "service_description": "Fix sink"},
        {"work_order_id": "wo-2", "appointment_id": "a2", "technician_id": "t2",
         "customer_id": "c2", "status": "completed", "service_description": "Install router"},
    ]
    data = ListWorkOrdersInput()
    result = await list_work_orders(MagicMock(), data)
    assert result.total == 2
    assert len(result.work_orders) == 2


@pytest.mark.asyncio
async def test_applies_filters(mock_pod):
    mock_pod.records.list.return_value = []
    data = ListWorkOrdersInput(technician_id="t1", status="created")
    await list_work_orders(MagicMock(), data)
    call_kwargs = mock_pod.records.list.call_args[1]
    assert call_kwargs["filters"]["technician_id"] == "t1"
    assert call_kwargs["filters"]["status"] == "created"


@pytest.mark.asyncio
async def test_returns_empty_list(mock_pod):
    mock_pod.records.list.return_value = []
    data = ListWorkOrdersInput()
    result = await list_work_orders(MagicMock(), data)
    assert result.total == 0
    assert result.work_orders == []