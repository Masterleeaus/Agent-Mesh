import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_technicians, ListTechniciansInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[
            {
                "id": "tech-1",
                "name": "Bob Smith",
                "primary_phone": "555-0100",
                "primary_email": "bob@example.com",
                "availability": "available",
                "status": "active",
                "rating": 4.5,
                "current_jobs_count": 1,
                "max_daily_jobs": 4,
            },
            {
                "id": "tech-2",
                "name": "Alice Jones",
                "primary_phone": "555-0200",
                "primary_email": "alice@example.com",
                "availability": "busy",
                "status": "active",
                "rating": 4.8,
                "current_jobs_count": 3,
                "max_daily_jobs": 5,
            },
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_lists_all_technicians(mock_pod):
    data = ListTechniciansInput()
    result = await list_technicians(MagicMock(), data)
    assert result.total == 2
    assert len(result.technicians) == 2
    assert result.technicians[0].name == "Bob Smith"
    assert result.technicians[1].name == "Alice Jones"


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = ListTechniciansInput(status="active")
    result = await list_technicians(MagicMock(), data)
    assert result.total == 2
    filters = mock_pod.records.list.call_args[1].get("filters", {})
    assert filters.get("status") == "active"


@pytest.mark.asyncio
async def test_filters_by_availability(mock_pod):
    data = ListTechniciansInput(availability="available")
    result = await list_technicians(MagicMock(), data)
    assert result.total == 2
    filters = mock_pod.records.list.call_args[1].get("filters", {})
    assert filters.get("availability") == "available"


@pytest.mark.asyncio
async def test_returns_empty_on_exception(mock_pod):
    mock_pod.records.list.side_effect = Exception("DB timeout")
    data = ListTechniciansInput()
    result = await list_technicians(MagicMock(), data)
    assert result.total == 0
    assert result.technicians == []
