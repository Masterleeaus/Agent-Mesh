import pytest
from unittest.mock import MagicMock, patch
from src.handler import assign_ticket, AssignTicketInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tkt-1", "assigned_to": None})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_assigns_ticket_successfully(mock_pod):
    data = AssignTicketInput(
        ticket_id="tkt-1",
        assigned_to="Bob",
        assigned_by="alice",
    )
    result = await assign_ticket(MagicMock(), data)
    assert result.status == "success"
    assert result.ticket_id == "tkt-1"
    assert result.assigned_to == "Bob"
    mock_pod.records.update.assert_called_once()
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert update_kwargs["assigned_to"] == "Bob"


@pytest.mark.asyncio
async def test_returns_not_found_when_ticket_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = AssignTicketInput(
        ticket_id="missing",
        assigned_to="Bob",
        assigned_by="alice",
    )
    result = await assign_ticket(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_logs_reassignment_when_already_assigned(mock_pod):
    mock_pod.records.get.return_value = {"id": "tkt-1", "assigned_to": "Charlie"}
    data = AssignTicketInput(
        ticket_id="tkt-1",
        assigned_to="Bob",
        assigned_by="alice",
    )
    result = await assign_ticket(MagicMock(), data)
    assert result.status == "success"
    log_call = mock_pod.records.create.call_args_list[0]
    assert log_call[0][1]["action"] == "ticket.reassigned"


@pytest.mark.asyncio
async def test_includes_assignment_note(mock_pod):
    data = AssignTicketInput(
        ticket_id="tkt-1",
        assigned_to="Bob",
        assigned_by="alice",
        assignment_note="Bob handles HVAC issues",
    )
    await assign_ticket(MagicMock(), data)
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert "human_notes" in update_kwargs
    assert "Bob handles HVAC issues" in update_kwargs["human_notes"]


@pytest.mark.asyncio
async def test_creates_events_and_operations_log(mock_pod):
    data = AssignTicketInput(
        ticket_id="tkt-1",
        assigned_to="Bob",
        assigned_by="alice",
    )
    await assign_ticket(MagicMock(), data)
    assert mock_pod.records.create.call_count == 2
    event_call = mock_pod.records.create.call_args_list[1]
    assert event_call[0][1]["event_name"] == "ticket.assigned"
