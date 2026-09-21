import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_followup
from src.models import CreateFollowupInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "acc-1", "open_followups": 3,
        })
        instance.records.create = MagicMock(side_effect=[
            {"id": "fup-1", "account_id": "acc-1"},
            None,
        ])
        instance.records.update = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_followup_with_pending_status(mock_pod):
    data = CreateFollowupInput(account_id="acc-1", type="call", subject="Check in")
    result = await create_followup(MagicMock(), data)
    assert result.status == "success"
    assert result.followup_id == "fup-1"
    create_call = mock_pod.records.create.call_args_list[0]
    assert create_call[0][1]["status"] == "pending"


@pytest.mark.asyncio
async def test_increments_open_followups(mock_pod):
    data = CreateFollowupInput(account_id="acc-1", type="call", subject="Check in")
    await create_followup(MagicMock(), data)
    mock_pod.records.update.assert_called_once_with("accounts", "acc-1", {
        "open_followups": 4,
        "updated_at": mock_pod.records.update.call_args[0][2]["updated_at"],
    })


@pytest.mark.asyncio
async def test_validates_account_exists(mock_pod):
    mock_pod.records.get.return_value = None
    data = CreateFollowupInput(account_id="missing", type="call", subject="Test")
    result = await create_followup(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_writes_operations_log(mock_pod):
    data = CreateFollowupInput(account_id="acc-1", type="email", subject="Follow-up", created_by="agent-1")
    await create_followup(MagicMock(), data)
    log_call = mock_pod.records.create.call_args_list[1]
    assert log_call[0][0] == "operations_log"
    assert log_call[0][1]["action"] == "create_followup"
    assert log_call[0][1]["actor"] == "agent-1"
