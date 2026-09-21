import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import collect_resolved_tickets, CollectResolvedTicketsInput


def make_ticket(overrides=None):
    base = {
        "id": "ticket-1", "customer_name": "Alice", "subject": "Test", "message": "Help",
        "channel": "email", "request_type": "complaint", "urgency": "normal",
        "owner": "Bob", "status": "closed", "human_notes": None, "updated_at": "2026-06-28T00:00:00Z",
    }
    if overrides:
        base.update(overrides)
    return base


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list.return_value.to_dict.return_value = {"items": [make_ticket()]}
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_only_closed_tickets(mock_pod):
    mock_pod.records.list.return_value.to_dict.return_value = {
        "items": [
            make_ticket({"id": "t1", "status": "closed"}),
            make_ticket({"id": "t2", "status": "open"}),
            make_ticket({"id": "t3", "status": "closed"}),
            make_ticket({"id": "t4", "status": "classified"}),
        ]
    }
    data = CollectResolvedTicketsInput(lookback_days=7, today=date(2026, 6, 28))
    result = await collect_resolved_tickets(MagicMock(), data)
    assert result.total_found == 2
    assert [t.ticket_id for t in result.tickets] == ["t1", "t3"]


@pytest.mark.asyncio
async def test_returns_empty_when_no_closed_tickets(mock_pod):
    mock_pod.records.list.return_value.to_dict.return_value = {
        "items": [make_ticket({"status": "open"}), make_ticket({"status": "new"})]
    }
    data = CollectResolvedTicketsInput(lookback_days=7, today=date(2026, 6, 28))
    result = await collect_resolved_tickets(MagicMock(), data)
    assert result.total_found == 0
    assert result.tickets == []


@pytest.mark.asyncio
async def test_respects_lookback_days(mock_pod):
    data = CollectResolvedTicketsInput(lookback_days=30, today=date(2026, 6, 28))
    result = await collect_resolved_tickets(MagicMock(), data)
    assert result.lookback_days == 30
    assert result.today == "2026-06-28"


@pytest.mark.asyncio
async def test_sends_discord_notification_when_tickets_found(mock_pod):
    data = CollectResolvedTicketsInput(lookback_days=7, today=date(2026, 6, 28))
    await collect_resolved_tickets(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()
    call_args = mock_pod.connectors.execute.call_args[0]
    assert call_args[1] == "chat_post_message"


@pytest.mark.asyncio
async def test_handles_empty_list_gracefully(mock_pod):
    mock_pod.records.list.return_value.to_dict.return_value = {"items": []}
    data = CollectResolvedTicketsInput(lookback_days=7, today=date(2026, 6, 28))
    result = await collect_resolved_tickets(MagicMock(), data)
    assert result.total_found == 0
