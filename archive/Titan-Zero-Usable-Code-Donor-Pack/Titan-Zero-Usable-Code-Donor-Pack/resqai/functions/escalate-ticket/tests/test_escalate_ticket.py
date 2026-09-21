import pytest
from unittest.mock import MagicMock, patch
from src.handler import escalate_ticket, EscalateTicketInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tkt-1", "status": "new", "urgency": "normal"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_escalates_ticket_successfully(mock_pod):
    data = EscalateTicketInput(
        ticket_id="tkt-1",
        escalation_reason="Customer threatening legal action",
        escalated_by="manager",
    )
    result = await escalate_ticket(MagicMock(), data)
    assert result.status == "success"
    assert result.ticket_id == "tkt-1"
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert update_kwargs["escalated_at"] is not None
    assert update_kwargs["escalation_reason"] == "Customer threatening legal action"
    assert update_kwargs["urgency"] == "urgent"


@pytest.mark.asyncio
async def test_returns_not_found_when_ticket_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = EscalateTicketInput(
        ticket_id="missing",
        escalation_reason="Test",
        escalated_by="manager",
    )
    result = await escalate_ticket(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_sends_discord_alert(mock_pod):
    data = EscalateTicketInput(
        ticket_id="tkt-1",
        escalation_reason="SLA breach imminent",
        escalated_by="workflow:sla-monitor",
    )
    await escalate_ticket(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()
    call_args = mock_pod.connectors.execute.call_args[0]
    assert call_args[0] == "resqai-discord"
    assert call_args[1] == "chat_post_message"


@pytest.mark.asyncio
async def test_handles_discord_failure_gracefully(mock_pod):
    mock_pod.connectors.execute.side_effect = Exception("Discord unavailable")
    data = EscalateTicketInput(
        ticket_id="tkt-1",
        escalation_reason="Emergency",
        escalated_by="manager",
    )
    result = await escalate_ticket(MagicMock(), data)
    assert result.status == "success"


@pytest.mark.asyncio
async def test_creates_events_and_operations_log(mock_pod):
    data = EscalateTicketInput(
        ticket_id="tkt-1",
        escalation_reason="Needs immediate attention",
        escalated_by="alice",
    )
    await escalate_ticket(MagicMock(), data)
    assert mock_pod.records.create.call_count == 2
    event_call = mock_pod.records.create.call_args_list[1]
    assert event_call[0][1]["event_name"] == "ticket.escalated"
