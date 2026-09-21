import pytest
from unittest.mock import MagicMock, patch
from src.handler import finalize_slippage_review, FinalizeSlippageReviewInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock()
        instance.connectors.execute = MagicMock()
        mock.from_env.return_value = instance
        yield instance


def make_data(overrides=None):
    base = {
        "slippage_counts": {"slipping": 3, "overdue": 1, "due_today": 2, "due_soon": 0},
        "slipping_followups": [
            {"followup_id": "fu-1", "customer_name": "Alice"},
            {"followup_id": "fu-2", "customer_name": "Bob"},
        ],
        "approved": True,
        "workflow_run_time": "2026-06-28T10:00:00Z",
    }
    if overrides:
        base.update(overrides)
    return FinalizeSlippageReviewInput(**base)


@pytest.mark.asyncio
async def test_logs_audit_entry_on_success(mock_pod):
    data = make_data()
    result = await finalize_slippage_review(MagicMock(), data)
    assert result.status == "success"
    assert result.audit_logged is True
    assert result.followup_count == 2
    mock_pod.records.create.assert_called_once_with(
        "operations_log",
        {
            "action": "followup-slippage review",
            "result": "approved=True, slipping_count=3, overdue=1, due_today=2, due_soon=0, followups=fu-1,fu-2",
            "actor": "workflow:followup-slippage-detector",
        },
    )


@pytest.mark.asyncio
async def test_sends_discord_when_approved_with_slipping(mock_pod):
    data = make_data()
    await finalize_slippage_review(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()


@pytest.mark.asyncio
async def test_skips_discord_when_not_approved(mock_pod):
    data = make_data({"approved": False})
    await finalize_slippage_review(MagicMock(), data)
    mock_pod.connectors.execute.assert_not_called()


@pytest.mark.asyncio
async def test_skips_discord_when_no_slipping(mock_pod):
    data = make_data({"slippage_counts": {"slipping": 0, "overdue": 0, "due_today": 0, "due_soon": 0}})
    await finalize_slippage_review(MagicMock(), data)
    mock_pod.connectors.execute.assert_not_called()


@pytest.mark.asyncio
async def test_truncates_followup_ids_in_log(mock_pod):
    many_followups = [{"followup_id": f"fu-{i}"} for i in range(15)]
    data = make_data({"slipping_followups": many_followups})
    result = await finalize_slippage_review(MagicMock(), data)
    assert result.followup_count == 15
    log_result = mock_pod.records.create.call_args[0][1]["result"]
    assert "+5 more" in log_result


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.create.side_effect = Exception("DB write failed")
    data = make_data()
    result = await finalize_slippage_review(MagicMock(), data)
    assert result.status == "error"
    assert result.audit_logged is False
