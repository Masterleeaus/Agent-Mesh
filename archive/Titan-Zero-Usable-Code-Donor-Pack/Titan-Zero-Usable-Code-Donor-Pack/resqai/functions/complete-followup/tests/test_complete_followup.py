import pytest
from unittest.mock import MagicMock, patch
from src.handler import complete_followup
from src.models import CompleteFollowupInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(side_effect=[
            {"id": "fup-1", "status": "pending", "account_id": "acc-1"},
            {"id": "acc-1", "open_followups": 5},
        ])
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_completes_followup(mock_pod):
    data = CompleteFollowupInput(followup_id="fup-1", completed_by="agent-1")
    result = await complete_followup(MagicMock(), data)
    assert result.status == "success"
    assert result.followup_id == "fup-1"
    mock_pod.records.update.assert_any_call("followups", "fup-1", {
        "status": "completed",
        "completed_at": mock_pod.records.update.call_args_list[0][0][2]["completed_at"],
        "completed_by": "agent-1",
        "completion_notes": None,
        "updated_at": mock_pod.records.update.call_args_list[0][0][2]["updated_at"],
    })


@pytest.mark.asyncio
async def test_decrements_open_followups(mock_pod):
    data = CompleteFollowupInput(followup_id="fup-1", completed_by="agent-1")
    await complete_followup(MagicMock(), data)
    mock_pod.records.update.assert_any_call("accounts", "acc-1", {
        "open_followups": 4,
        "updated_at": mock_pod.records.update.call_args_list[1][0][2]["updated_at"],
    })


@pytest.mark.asyncio
async def test_returns_error_when_not_found(mock_pod):
    mock_pod.records.get.side_effect = [None]
    data = CompleteFollowupInput(followup_id="missing", completed_by="agent-1")
    result = await complete_followup(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_returns_error_when_already_completed(mock_pod):
    mock_pod.records.get.side_effect = [
        {"id": "fup-1", "status": "completed", "account_id": "acc-1"},
    ]
    data = CompleteFollowupInput(followup_id="fup-1", completed_by="agent-1")
    result = await complete_followup(MagicMock(), data)
    assert result.status == "error"
    assert "already completed" in result.error


@pytest.mark.asyncio
async def test_writes_operations_log(mock_pod):
    data = CompleteFollowupInput(followup_id="fup-1", completed_by="agent-1")
    await complete_followup(MagicMock(), data)
    log_call = mock_pod.records.create.call_args[0]
    assert log_call[0] == "operations_log"
    assert log_call[1]["action"] == "complete_followup"
