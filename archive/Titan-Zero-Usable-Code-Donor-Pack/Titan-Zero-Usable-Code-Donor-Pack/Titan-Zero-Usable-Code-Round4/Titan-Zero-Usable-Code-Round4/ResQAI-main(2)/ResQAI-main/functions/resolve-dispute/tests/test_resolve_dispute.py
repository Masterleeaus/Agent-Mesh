import pytest
from unittest.mock import MagicMock, patch
from src.handler import resolve_dispute, ResolveDisputeInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "disp-1", "status": "under_review"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_approves_dispute_successfully(mock_pod):
    data = ResolveDisputeInput(
        dispute_id="disp-1", action="approve", recommended_resolution="full_refund",
        resolution_reason="Customer valid claim", confidence=0.92,
    )
    result = await resolve_dispute(MagicMock(), data)
    assert result.status == "success"
    assert result.dispute_id == "disp-1"
    mock_pod.records.update.assert_any_call("disputes", "disp-1", {
        "status": "closed", "recommended_resolution": "full_refund",
        "resolution_reason": "Customer valid claim", "confidence": 0.92,
    })


@pytest.mark.asyncio
async def test_approve_closes_linked_ticket(mock_pod):
    mock_pod.records.get.side_effect = [
        {"id": "disp-1", "status": "under_review"},
        {"id": "tkt-1", "status": "open"},
    ]
    data = ResolveDisputeInput(dispute_id="disp-1", action="approve", ticket_id="tkt-1")
    await resolve_dispute(MagicMock(), data)
    mock_pod.records.update.assert_any_call("tickets", "tkt-1", {"status": "closed", "human_notes": None})


@pytest.mark.asyncio
async def test_rejects_dispute_and_reopens(mock_pod):
    data = ResolveDisputeInput(dispute_id="disp-1", action="reject", human_notes="Need more evidence")
    result = await resolve_dispute(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.update.assert_called_once_with("disputes", "disp-1", {
        "status": "open", "recommended_resolution": None, "resolution_reason": None,
        "confidence": None, "human_notes": "Need more evidence",
    })


@pytest.mark.asyncio
async def test_returns_error_for_unknown_action(mock_pod):
    data = ResolveDisputeInput(dispute_id="disp-1", action="unknown")
    result = await resolve_dispute(MagicMock(), data)
    assert result.status == "error"
    assert "Unknown action" in result.error


@pytest.mark.asyncio
async def test_returns_error_when_dispute_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = ResolveDisputeInput(dispute_id="missing", action="approve")
    result = await resolve_dispute(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_sends_discord_on_approve(mock_pod):
    data = ResolveDisputeInput(dispute_id="disp-1", action="approve")
    await resolve_dispute(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()


@pytest.mark.asyncio
async def test_sends_discord_on_reject(mock_pod):
    data = ResolveDisputeInput(dispute_id="disp-1", action="reject")
    await resolve_dispute(MagicMock(), data)
    assert mock_pod.connectors.execute.call_count == 1
