import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_inventory
from src.models import ListInventoryInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_lists_all_items(mock_pod):
    mock_pod.records.list.return_value = [
        {"item_id": "i1", "name": "Router", "sku": "R-1", "quantity_on_hand": 50, "reorder_threshold": 10, "unit_price_cents": 5000},
        {"item_id": "i2", "name": "Cable", "sku": "C-1", "quantity_on_hand": 5, "reorder_threshold": 20, "unit_price_cents": 500},
    ]
    data = ListInventoryInput()
    result = await list_inventory(MagicMock(), data)
    assert result.total == 2
    assert len(result.items) == 2


@pytest.mark.asyncio
async def test_low_stock_filter(mock_pod):
    mock_pod.records.list.return_value = [
        {"item_id": "i1", "name": "Router", "sku": "R-1", "quantity_on_hand": 50, "reorder_threshold": 10, "unit_price_cents": 5000},
        {"item_id": "i2", "name": "Cable", "sku": "C-1", "quantity_on_hand": 5, "reorder_threshold": 20, "unit_price_cents": 500},
    ]
    data = ListInventoryInput(low_stock_only=True)
    result = await list_inventory(MagicMock(), data)
    assert result.total == 1
    assert result.items[0].item_id == "i2"


@pytest.mark.asyncio
async def test_category_filter(mock_pod):
    mock_pod.records.list.return_value = []
    data = ListInventoryInput(category="Cables")
    await list_inventory(MagicMock(), data)
    call_kwargs = mock_pod.records.list.call_args[1]
    assert call_kwargs["filters"]["category"] == "Cables"


@pytest.mark.asyncio
async def test_returns_empty(mock_pod):
    mock_pod.records.list.return_value = []
    data = ListInventoryInput()
    result = await list_inventory(MagicMock(), data)
    assert result.total == 0
    assert result.items == []