import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_followups
from src.models import ListFollowupsInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.query = MagicMock(return_value=[
            {"id": "fup-1", "account_id": "acc-1", "customer_id": "cust-1",
             "type": "call", "subject": "Check in", "status": "pending",
             "priority": "high", "due_date": "2026-07-01", "assigned_to": "agent-1",
             "related_ticket_id": None, "related_appointment_id": None, "notes": "Test"},
            {"id": "fup-2", "account_id": "acc-1", "customer_id": "cust-1",
             "type": "email", "subject": "Follow-up", "status": "completed",
             "priority": "normal", "due_date": "2026-06-15", "assigned_to": None,
             "related_ticket_id": None, "related_appointment_id": None, "notes": None},
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_all_followups(mock_pod):
    data = ListFollowupsInput()
    result = await list_followups(MagicMock(), data)
    assert result.total == 2
    assert len(result.followups) == 2


@pytest.mark.asyncio
async def test_filters_by_account(mock_pod):
    data = ListFollowupsInput(account_id="acc-1")
    await list_followups(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("followups", {"account_id": "acc-1"})


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = ListFollowupsInput(status="pending")
    await list_followups(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("followups", {"status": "pending"})


@pytest.mark.asyncio
async def test_filters_by_assigned_to(mock_pod):
    data = ListFollowupsInput(assigned_to="agent-1")
    await list_followups(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("followups", {"assigned_to": "agent-1"})


@pytest.mark.asyncio
async def test_filters_by_due_date_range(mock_pod):
    data = ListFollowupsInput(due_date_from="2026-07-01", due_date_to="2026-07-31")
    result = await list_followups(MagicMock(), data)
    assert len(result.followups) == 1
    assert result.followups[0].followup_id == "fup-1"
