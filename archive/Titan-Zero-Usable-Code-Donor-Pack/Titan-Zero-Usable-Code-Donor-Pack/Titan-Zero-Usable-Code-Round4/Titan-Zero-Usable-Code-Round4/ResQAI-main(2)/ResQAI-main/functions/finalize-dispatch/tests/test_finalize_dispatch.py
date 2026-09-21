import pytest
from unittest.mock import MagicMock, patch
from src.handler import finalize_dispatch, FinalizeDispatchInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "tkt-1", "status": "new"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_dispatches_ticket_successfully(mock_pod):
    data = FinalizeDispatchInput(
        ticket_id="tkt-1", assigned_technician="Bob", dispatcher="workflow:urgent-dispatch", status="dispatched"
    )
    result = await finalize_dispatch(MagicMock(), data)
    assert result.status == "success"
    assert result.ticket_id == "tkt-1"
    assert result.audit_logged is True
    mock_pod.records.update.assert_called_once()
    update_args = mock_pod.records.update.call_args[0]
    assert update_args[0] == "tickets"
    assert update_args[1] == "tkt-1"


@pytest.mark.asyncio
async def test_returns_not_found_when_ticket_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = FinalizeDispatchInput(ticket_id="missing", dispatcher="test", status="dispatched")
    result = await finalize_dispatch(MagicMock(), data)
    assert result.status == "not_found"
    assert result.audit_logged is False


@pytest.mark.asyncio
async def test_sends_discord_alert_for_dispatched(mock_pod):
    data = FinalizeDispatchInput(
        ticket_id="tkt-1", assigned_technician="Bob", dispatcher="workflow:urgent-dispatch", status="dispatched"
    )
    await finalize_dispatch(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()


@pytest.mark.asyncio
async def test_skips_discord_for_escalation(mock_pod):
    data = FinalizeDispatchInput(ticket_id="tkt-1", dispatcher="human:manager", status="escalation")
    await finalize_dispatch(MagicMock(), data)
    mock_pod.connectors.execute.assert_not_called()


@pytest.mark.asyncio
async def test_includes_dispatch_notes(mock_pod):
    data = FinalizeDispatchInput(
        ticket_id="tkt-1", assigned_technician="Bob", dispatch_notes="Urgent leak", dispatcher="test", status="dispatched"
    )
    await finalize_dispatch(MagicMock(), data)
    update_kwargs = mock_pod.records.update.call_args[0][2]
    assert update_kwargs["human_notes"] == "Urgent leak"
