import pytest
from unittest.mock import MagicMock, patch
from src.handler import resolve_dispute_v2
from src.models import ResolveDisputeV2Input


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "disp-1", "status": "under_review", "ticket_id": "tkt-1",
            "customer_email": "customer@test.com",
        })
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_resolves_dispute_successfully(mock_pod):
    data = ResolveDisputeV2Input(
        dispute_id="disp-1", resolution_type="full_refund",
        resolution_notes="Valid claim", resolved_by="agent-1",
    )
    result = await resolve_dispute_v2(MagicMock(), data)
    assert result.status == "success"
    assert result.dispute_id == "disp-1"
    assert result.resolution_type == "full_refund"


@pytest.mark.asyncio
async def test_closes_dispute_record(mock_pod):
    data = ResolveDisputeV2Input(
        dispute_id="disp-1", resolution_type="partial_refund", resolved_by="agent-1",
    )
    await resolve_dispute_v2(MagicMock(), data)
    mock_pod.records.update.assert_any_call("disputes", "disp-1", {
        "status": "closed",
        "resolution_type": "partial_refund",
        "resolution_notes": None,
        "resolved_by": "agent-1",
        "closed_at": mock_pod.records.update.call_args_list[0][0][2]["closed_at"],
        "updated_at": mock_pod.records.update.call_args_list[0][0][2]["updated_at"],
    })


@pytest.mark.asyncio
async def test_closes_linked_ticket(mock_pod):
    mock_pod.records.get.side_effect = [
        {"id": "disp-1", "status": "under_review", "ticket_id": "tkt-1"},
        {"id": "tkt-1", "status": "open"},
    ]
    data = ResolveDisputeV2Input(
        dispute_id="disp-1", resolution_type="redo_service", resolved_by="agent-1",
    )
    await resolve_dispute_v2(MagicMock(), data)
    mock_pod.records.update.assert_any_call("tickets", "tkt-1", {
        "status": "closed",
        "resolution_type": "redo_service",
        "resolution_notes": None,
        "updated_at": mock_pod.records.update.call_args_list[1][0][2]["updated_at"],
    })


@pytest.mark.asyncio
async def test_returns_error_when_dispute_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = ResolveDisputeV2Input(
        dispute_id="missing", resolution_type="no_action", resolved_by="agent-1",
    )
    result = await resolve_dispute_v2(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_returns_error_when_already_closed(mock_pod):
    mock_pod.records.get.return_value = {"id": "disp-1", "status": "closed"}
    data = ResolveDisputeV2Input(
        dispute_id="disp-1", resolution_type="no_action", resolved_by="agent-1",
    )
    result = await resolve_dispute_v2(MagicMock(), data)
    assert result.status == "error"
    assert "already closed" in result.error


@pytest.mark.asyncio
async def test_sends_notification_when_requested(mock_pod):
    data = ResolveDisputeV2Input(
        dispute_id="disp-1", resolution_type="discount_credit",
        resolved_by="agent-1", notify_customer=True,
    )
    await resolve_dispute_v2(MagicMock(), data)
    assert mock_pod.connectors.execute.call_count >= 1
