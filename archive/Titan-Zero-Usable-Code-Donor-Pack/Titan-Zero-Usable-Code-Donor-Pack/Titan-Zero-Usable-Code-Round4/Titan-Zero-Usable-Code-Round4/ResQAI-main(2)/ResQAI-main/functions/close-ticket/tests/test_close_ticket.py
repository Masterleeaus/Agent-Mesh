import pytest
from unittest.mock import MagicMock, patch
from src.handler import close_ticket, CloseTicketInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tkt-1", "status": "new", "customer_id": "cust-1", "subject": "Help"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_closes_ticket_successfully(mock_pod):
    data = CloseTicketInput(
        ticket_id="tkt-1",
        resolution_summary="Fixed on site",
        closed_by="bob",
    )
    result = await close_ticket(MagicMock(), data)
    assert result.status == "success"
    assert result.ticket_id == "tkt-1"
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert update_kwargs["status"] == "closed"
    assert "closed_at" in update_kwargs


@pytest.mark.asyncio
async def test_returns_not_found_when_ticket_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = CloseTicketInput(
        ticket_id="missing",
        resolution_summary="Done",
        closed_by="bob",
    )
    result = await close_ticket(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_returns_already_closed(mock_pod):
    mock_pod.records.get.return_value = {"id": "tkt-1", "status": "closed"}
    data = CloseTicketInput(
        ticket_id="tkt-1",
        resolution_summary="Done",
        closed_by="bob",
    )
    result = await close_ticket(MagicMock(), data)
    assert result.status == "already_closed"
    assert "already closed" in result.error


@pytest.mark.asyncio
async def test_sends_notification_when_requested(mock_pod):
    mock_pod.records.get.side_effect = [
        {"id": "tkt-1", "status": "new", "customer_id": "cust-1", "subject": "AC broken"},
        {"id": "cust-1", "email": "alice@example.com", "name": "Alice"},
    ]
    data = CloseTicketInput(
        ticket_id="tkt-1",
        resolution_summary="Replaced capacitor",
        closed_by="bob",
        send_notification=True,
    )
    await close_ticket(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()
    call_args = mock_pod.connectors.execute.call_args[0]
    assert call_args[0] == "resqai-gmail"
    assert call_args[1] == "gmail_send_email"


@pytest.mark.asyncio
async def test_skips_notification_when_not_requested(mock_pod):
    data = CloseTicketInput(
        ticket_id="tkt-1",
        resolution_summary="Done",
        closed_by="bob",
        send_notification=False,
    )
    await close_ticket(MagicMock(), data)
    mock_pod.connectors.execute.assert_not_called()


@pytest.mark.asyncio
async def test_creates_events_and_operations_log(mock_pod):
    data = CloseTicketInput(
        ticket_id="tkt-1",
        resolution_summary="Fixed",
        closed_by="bob",
    )
    await close_ticket(MagicMock(), data)
    assert mock_pod.records.create.call_count == 2
    event_call = mock_pod.records.create.call_args_list[1]
    assert event_call[0][1]["event_name"] == "ticket.closed"
