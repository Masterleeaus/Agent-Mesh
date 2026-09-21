import pytest
from unittest.mock import MagicMock, patch
from src.handler import search_customers
from src.models import SearchCustomersInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.query = MagicMock(return_value=[
            {"id": "cust-1", "name": "Acme Corp", "primary_email": "info@acme.com",
             "primary_phone": "+1", "status": "active", "customer_type": "business", "tags": ["vip"]},
            {"id": "cust-2", "name": "Beta Inc", "primary_email": "info@beta.com",
             "primary_phone": "+2", "status": "active", "customer_type": "business", "tags": []},
            {"id": "cust-3", "name": "Gamma LLC", "primary_email": "info@gamma.com",
             "primary_phone": "+3", "status": "inactive", "customer_type": "individual", "tags": []},
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_all_customers(mock_pod):
    data = SearchCustomersInput()
    result = await search_customers(MagicMock(), data)
    assert result.total == 3
    assert len(result.results) == 3
    mock_pod.records.query.assert_called_once_with("customers", {})


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = SearchCustomersInput(status="active")
    await search_customers(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("customers", {"status": "active"})


@pytest.mark.asyncio
async def test_filters_by_customer_type(mock_pod):
    data = SearchCustomersInput(customer_type="business")
    await search_customers(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("customers", {"customer_type": "business"})


@pytest.mark.asyncio
async def test_searches_by_name_substring(mock_pod):
    data = SearchCustomersInput(query="acme")
    result = await search_customers(MagicMock(), data)
    assert result.total == 1
    assert result.results[0].name == "Acme Corp"


@pytest.mark.asyncio
async def test_respects_limit(mock_pod):
    data = SearchCustomersInput(limit=2)
    result = await search_customers(MagicMock(), data)
    assert len(result.results) == 2
