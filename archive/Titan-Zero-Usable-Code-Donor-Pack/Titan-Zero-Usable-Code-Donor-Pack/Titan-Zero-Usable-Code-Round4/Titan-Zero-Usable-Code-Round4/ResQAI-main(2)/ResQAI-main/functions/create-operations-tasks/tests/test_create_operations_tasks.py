import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import create_operations_tasks, CreateOperationsTasksInput, OperationRecommendation


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_tasks_for_each_recommendation(mock_pod):
    data = CreateOperationsTasksInput(
        recommendations=[
            OperationRecommendation(team="dispatch", action="Review pending dispatches", priority="high"),
            OperationRecommendation(team="field", action="Check inventory levels", priority="normal"),
        ],
        today=date(2026, 6, 28),
    )
    result = await create_operations_tasks(MagicMock(), data)
    assert result.tasks_created == 2
    assert sorted(result.teams) == ["dispatch", "field"]
    assert result.audit_logged is True
    assert mock_pod.records.create.call_count == 3


@pytest.mark.asyncio
async def test_deduplicates_teams(mock_pod):
    data = CreateOperationsTasksInput(
        recommendations=[
            OperationRecommendation(team="dispatch", action="Task 1"),
            OperationRecommendation(team="dispatch", action="Task 2"),
            OperationRecommendation(team="field", action="Task 3"),
        ],
        today=date(2026, 6, 28),
    )
    result = await create_operations_tasks(MagicMock(), data)
    assert result.tasks_created == 3
    assert sorted(result.teams) == ["dispatch", "field"]


@pytest.mark.asyncio
async def test_handles_empty_recommendations(mock_pod):
    data = CreateOperationsTasksInput(
        recommendations=[],
        today=date(2026, 6, 28),
    )
    result = await create_operations_tasks(MagicMock(), data)
    assert result.tasks_created == 0
    assert result.teams == []
