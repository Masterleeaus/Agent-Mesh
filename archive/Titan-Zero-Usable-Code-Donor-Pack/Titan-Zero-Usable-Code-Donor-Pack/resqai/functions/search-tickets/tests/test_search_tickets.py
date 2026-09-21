import pytest
from unittest.mock import MagicMock, patch
from src.handler import search_tickets, SearchTicketsInput


def make_ticket(overrides=None):
    base = {
        "id": "tkt-1", "customer_name": "Alice", "subject": "AC broken",
        "status": "new", "urgency": "high", "assigned_to": "Bob",
        "created_at": "2026-06-28T00:00:00Z", "channel": "phone",
    }
    if overrides:
        base.update(overrides)
    return base


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list.return_value.to_dict.return_value = {
            "items": [
                make_ticket({"id": "t1", "status": "new", "urgency": "high", "customer_name": "Alice"}),
                make_ticket({"id": "t2", "status": "closed", "urgency": "normal", "customer_name": "Bob"}),
                make_ticket({"id": "t3", "status": "new", "urgency": "urgent", "customer_name": "Charlie"}),
                make_ticket({"id": "t4", "status": "classified", "urgency": "low", "customer_name": "Alice"}),
            ]
        }
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_all_tickets_when_no_filters(mock_pod):
    data = SearchTicketsInput()
    result = await search_tickets(MagicMock(), data)
    assert result.total == 4
    assert len(result.results) == 4


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = SearchTicketsInput(status="new")
    result = await search_tickets(MagicMock(), data)
    assert result.total == 2
    assert all(r.status == "new" for r in result.results)


@pytest.mark.asyncio
async def test_filters_by_urgency(mock_pod):
    data = SearchTicketsInput(urgency="high")
    result = await search_tickets(MagicMock(), data)
    assert result.total == 1


@pytest.mark.asyncio
async def test_filters_by_assigned_to(mock_pod):
    data = SearchTicketsInput(assigned_to="Bob")
    result = await search_tickets(MagicMock(), data)
    assert result.total == 4


@pytest.mark.asyncio
async def test_filters_by_customer_name_substring(mock_pod):
    data = SearchTicketsInput(customer_name="ali")
    result = await search_tickets(MagicMock(), data)
    assert result.total == 2


@pytest.mark.asyncio
async def test_filters_by_channel(mock_pod):
    data = SearchTicketsInput(channel="phone")
    result = await search_tickets(MagicMock(), data)
    assert result.total == 4


@pytest.mark.asyncio
async def test_respects_limit_and_offset(mock_pod):
    data = SearchTicketsInput(limit=2, offset=1)
    result = await search_tickets(MagicMock(), data)
    assert result.total == 4
    assert len(result.results) == 2


@pytest.mark.asyncio
async def test_returns_empty_when_no_match(mock_pod):
    data = SearchTicketsInput(status="nonexistent")
    result = await search_tickets(MagicMock(), data)
    assert result.total == 0
    assert result.results == []
