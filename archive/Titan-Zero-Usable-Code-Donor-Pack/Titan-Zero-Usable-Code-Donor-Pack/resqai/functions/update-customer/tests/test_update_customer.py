import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_customer
from src.models import UpdateCustomerInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "cust-1", "name": "Old Name", "status": "active",
        })
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_customer_fields(mock_pod):
    data = UpdateCustomerInput(customer_id="cust-1", name="New Name", primary_email="new@test.com")
    result = await update_customer(MagicMock(), data)
    assert result.status == "success"
    assert result.customer_id == "cust-1"
    mock_pod.records.update.assert_called_once()
    updates = mock_pod.records.update.call_args[0][2]
    assert updates["name"] == "New Name"
    assert updates["primary_email"] == "new@test.com"


@pytest.mark.asyncio
async def test_skips_none_fields(mock_pod):
    data = UpdateCustomerInput(customer_id="cust-1", name="New Name")
    await update_customer(MagicMock(), data)
    updates = mock_pod.records.update.call_args[0][2]
    assert "primary_phone" not in updates
    assert updates["name"] == "New Name"


@pytest.mark.asyncio
async def test_returns_error_when_customer_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateCustomerInput(customer_id="missing")
    result = await update_customer(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_writes_operations_log(mock_pod):
    data = UpdateCustomerInput(customer_id="cust-1", name="Updated", updated_by="agent-1")
    await update_customer(MagicMock(), data)
    log_call = mock_pod.records.create.call_args[0]
    assert log_call[0] == "operations_log"
    assert log_call[1]["action"] == "update_customer"
    assert log_call[1]["actor"] == "agent-1"
