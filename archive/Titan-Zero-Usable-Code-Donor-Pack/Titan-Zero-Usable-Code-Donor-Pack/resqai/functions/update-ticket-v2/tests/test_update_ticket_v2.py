import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_ticket_v2, UpdateTicketV2Input


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tkt-1", "status": "new"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_ticket_successfully(mock_pod):
    data = UpdateTicketV2Input(
        ticket_id="tkt-1",
        status="classified",
        human_notes="Reviewed by agent",
        updated_by="bob",
    )
    result = await update_ticket_v2(MagicMock(), data)
    assert result.status == "success"
    assert result.ticket_id == "tkt-1"
    mock_pod.records.update.assert_called_once()
    update_args = mock_pod.records.update.call_args[0]
    assert update_args[0] == "tickets"
    assert update_args[1] == "tkt-1"
    assert update_args[2]["status"] == "classified"
    assert update_args[2]["human_notes"] == "Reviewed by agent"


@pytest.mark.asyncio
async def test_returns_not_found_when_ticket_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateTicketV2Input(ticket_id="missing")
    result = await update_ticket_v2(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_sets_closed_at_when_status_closed(mock_pod):
    data = UpdateTicketV2Input(
        ticket_id="tkt-1",
        status="closed",
        resolution_summary="Fixed on site",
    )
    result = await update_ticket_v2(MagicMock(), data)
    assert result.status == "success"
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert update_kwargs["status"] == "closed"
    assert "closed_at" in update_kwargs


@pytest.mark.asyncio
async def test_updates_without_optional_fields(mock_pod):
    data = UpdateTicketV2Input(ticket_id="tkt-1")
    result = await update_ticket_v2(MagicMock(), data)
    assert result.status == "success"
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert "updated_at" in update_kwargs
    assert "status" not in update_kwargs


@pytest.mark.asyncio
async def test_creates_events_and_operations_log(mock_pod):
    data = UpdateTicketV2Input(ticket_id="tkt-1", status="drafted", updated_by="alice")
    await update_ticket_v2(MagicMock(), data)
    assert mock_pod.records.create.call_count == 2
    log_call = mock_pod.records.create.call_args_list[0]
    event_call = mock_pod.records.create.call_args_list[1]
    assert log_call[0][0] == "operations_log"
    assert event_call[0][0] == "events"
    assert event_call[0][1]["event_name"] == "ticket.updated"
