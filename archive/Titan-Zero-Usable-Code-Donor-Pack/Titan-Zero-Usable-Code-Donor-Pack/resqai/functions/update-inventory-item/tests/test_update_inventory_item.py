import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_inventory_item
from src.models import UpdateInventoryItemInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock()
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_name(mock_pod):
    mock_pod.records.get.return_value = {"item_id": "item-1", "name": "Old Name", "quantity_on_hand": 10}
    data = UpdateInventoryItemInput(item_id="item-1", name="New Name")
    result = await update_inventory_item(MagicMock(), data)
    assert result.status == "success"
    args = mock_pod.records.update.call_args[1]
    assert args["name"] == "New Name"


@pytest.mark.asyncio
async def test_creates_transaction_on_quantity_change(mock_pod):
    mock_pod.records.get.return_value = {"item_id": "item-1", "name": "Test", "quantity_on_hand": 10}
    data = UpdateInventoryItemInput(item_id="item-1", quantity_on_hand=25)
    result = await update_inventory_item(MagicMock(), data)
    assert result.status == "success"
    tx_call = mock_pod.records.create.call_args_list[0][1]
    assert tx_call["item_id"] == "item-1"
    assert tx_call["previous_quantity"] == 10
    assert tx_call["new_quantity"] == 25
    assert tx_call["change"] == 15


@pytest.mark.asyncio
async def test_returns_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateInventoryItemInput(item_id="missing")
    result = await update_inventory_item(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_no_updates_returns_success(mock_pod):
    mock_pod.records.get.return_value = {"item_id": "item-1", "name": "Test", "quantity_on_hand": 10}
    data = UpdateInventoryItemInput(item_id="item-1")
    result = await update_inventory_item(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.update.assert_not_called()