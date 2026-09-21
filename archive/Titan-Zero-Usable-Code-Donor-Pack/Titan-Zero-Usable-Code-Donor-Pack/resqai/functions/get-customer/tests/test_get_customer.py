import pytest
from unittest.mock import MagicMock, patch
from src.handler import get_customer
from src.models import GetCustomerInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "cust-1", "name": "Acme Corp", "status": "active",
        })
        instance.records.query = MagicMock(return_value=[
            {"id": "acc-1", "customer_id": "cust-1", "health": "healthy"},
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_customer(mock_pod):
    data = GetCustomerInput(customer_id="cust-1")
    result = await get_customer(MagicMock(), data)
    assert result.status == "success"
    assert result.customer["id"] == "cust-1"
    assert result.customer["name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_returns_error_when_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = GetCustomerInput(customer_id="missing")
    result = await get_customer(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_includes_account_when_requested(mock_pod):
    data = GetCustomerInput(customer_id="cust-1", include_account=True)
    result = await get_customer(MagicMock(), data)
    assert result.account is not None
    assert result.account["customer_id"] == "cust-1"


@pytest.mark.asyncio
async def test_skips_account_by_default(mock_pod):
    data = GetCustomerInput(customer_id="cust-1")
    result = await get_customer(MagicMock(), data)
    assert result.account is None
    mock_pod.records.query.assert_not_called()
