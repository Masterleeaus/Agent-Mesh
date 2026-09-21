import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import create_followup_tasks, CreateFollowupTasksInput, Recommendation


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_tasks_for_each_recommendation(mock_pod):
    data = CreateFollowupTasksInput(
        recommendations=[
            Recommendation(account_id="acc-1", customer_id="cust-1", action="Call client", priority="high"),
            Recommendation(account_id="acc-2", customer_id="cust-2", action="Send proposal", priority="normal"),
        ],
        today=date(2026, 6, 28),
    )
    result = await create_followup_tasks(MagicMock(), data)
    assert result.tasks_created == 2
    assert result.audit_logged is True
    assert mock_pod.records.create.call_count == 3


@pytest.mark.asyncio
async def test_returns_zero_when_no_recommendations(mock_pod):
    data = CreateFollowupTasksInput(recommendations=[], today=date(2026, 6, 28))
    result = await create_followup_tasks(MagicMock(), data)
    assert result.tasks_created == 0
