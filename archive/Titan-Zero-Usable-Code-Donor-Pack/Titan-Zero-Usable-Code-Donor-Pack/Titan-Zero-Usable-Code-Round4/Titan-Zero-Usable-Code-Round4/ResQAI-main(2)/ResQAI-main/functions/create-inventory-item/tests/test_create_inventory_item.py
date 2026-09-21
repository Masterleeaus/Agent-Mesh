import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_inventory_item
from src.models import CreateInventoryItemInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_item_successfully(mock_pod):
    mock_pod.records.list.return_value = []
    data = CreateInventoryItemInput(name="WiFi Router", sku="ROUTER-100")
    result = await create_inventory_item(MagicMock(), data)
    assert result.status == "success"
    assert result.item_id is not None
    assert mock_pod.records.create.call_count == 2


@pytest.mark.asyncio
async def test_rejects_duplicate_sku(mock_pod):
    mock_pod.records.list.return_value = [{"item_id": "existing", "sku": "ROUTER-100"}]
    data = CreateInventoryItemInput(name="WiFi Router", sku="ROUTER-100")
    result = await create_inventory_item(MagicMock(), data)
    assert result.status == "conflict"
    assert "already exists" in result.error
    assert result.item_id is None


@pytest.mark.asyncio
async def test_creates_with_all_fields(mock_pod):
    mock_pod.records.list.return_value = []
    data = CreateInventoryItemInput(
        name="Ethernet Cable",
        sku="CABLE-1M",
        description="1m Cat6 cable",
        category="Cables",
        unit_price_cents=500,
        quantity_on_hand=100,
        reorder_threshold=20,
        reorder_quantity=200,
        supplier_info="Acme Corp",
    )
    result = await create_inventory_item(MagicMock(), data)
    assert result.status == "success"
    call_args = mock_pod.records.create.call_args_list[0][1]
    assert call_args["unit_price_cents"] == 500
    assert call_args["quantity_on_hand"] == 100