import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_customer
from src.models import CreateCustomerInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock(side_effect=[
            {"id": "cust-1", "name": "Acme Corp"},
            {"id": "acc-1", "customer_id": "cust-1", "health": "healthy"},
            None,
        ])
        instance.records.get = MagicMock()
        instance.records.update = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_customer_and_account(mock_pod):
    data = CreateCustomerInput(name="Acme Corp", created_by="user-1")
    result = await create_customer(MagicMock(), data)
    assert result.status == "success"
    assert result.customer_id == "cust-1"
    assert mock_pod.records.create.call_count == 3


@pytest.mark.asyncio
async def test_requires_name(mock_pod):
    data = CreateCustomerInput(name="")
    result = await create_customer(MagicMock(), data)
    assert result.status == "error"
    assert "name is required" in result.error
    assert mock_pod.records.create.call_count == 0


@pytest.mark.asyncio
async def test_creates_account_with_default_health(mock_pod):
    data = CreateCustomerInput(name="Test Customer")
    await create_customer(MagicMock(), data)
    account_call = mock_pod.records.create.call_args_list[1]
    assert account_call[0][0] == "accounts"
    assert account_call[0][1]["health"] == "healthy"
    assert account_call[0][1]["health_score"] == 1.0


@pytest.mark.asyncio
async def test_creates_operations_log(mock_pod):
    data = CreateCustomerInput(name="Acme Corp", created_by="agent-1")
    await create_customer(MagicMock(), data)
    log_call = mock_pod.records.create.call_args_list[2]
    assert log_call[0][0] == "operations_log"
    assert log_call[0][1]["action"] == "create_customer"
    assert log_call[0][1]["actor"] == "agent-1"


@pytest.mark.asyncio
async def test_passes_optional_fields(mock_pod):
    data = CreateCustomerInput(
        name="Acme Corp",
        primary_phone="+1234567890",
        primary_email="info@acme.com",
        customer_type="business",
        timezone="America/New_York",
        tags=["vip", "new"],
    )
    await create_customer(MagicMock(), data)
    customer_call = mock_pod.records.create.call_args_list[0]
    assert customer_call[0][1]["primary_phone"] == "+1234567890"
    assert customer_call[0][1]["primary_email"] == "info@acme.com"
    assert customer_call[0][1]["customer_type"] == "business"
    assert customer_call[0][1]["timezone"] == "America/New_York"
    assert customer_call[0][1]["tags"] == ["vip", "new"]
