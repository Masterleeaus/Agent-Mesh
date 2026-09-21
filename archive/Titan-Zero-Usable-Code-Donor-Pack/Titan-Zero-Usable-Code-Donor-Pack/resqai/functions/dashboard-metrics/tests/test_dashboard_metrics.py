import pytest
from unittest.mock import MagicMock, patch
from src.handler import dashboard_metrics
from src.models import DashboardMetricsInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_computes_all_summaries(mock_pod):
    mock_pod.records.list.side_effect = [
        [{"id": "t1", "status": "closed", "urgency": "high"}],
        [{"appointment_id": "a1", "status": "completed"}],
        [{"id": "c1"}],
        [{"id": "u1", "role": "technician"}, {"id": "u2", "role": "admin"}],
        [{"customer_id": "c1", "score": 85}],
        [{"id": "f1", "status": "pending"}],
        [{"work_order_id": "wo1", "status": "in_progress"}],
    ]

    data = DashboardMetricsInput()
    result = await dashboard_metrics(MagicMock(), data)
    assert result.tickets_summary["total"] == 1
    assert result.appointments_summary["total"] == 1
    assert result.technician_summary["total_technicians"] == 1
    assert result.technician_summary["active_work_orders"] == 1
    assert result.account_health_summary["total_accounts"] == 1
    assert result.account_health_summary["average_score"] == 85.0
    assert result.followup_summary["pending"] == 1
    assert result.trends is None


@pytest.mark.asyncio
async def test_includes_trends_when_requested(mock_pod):
    mock_pod.records.list.side_effect = [[], [], [], [], [], [], []]
    data = DashboardMetricsInput(include_trends=True)
    result = await dashboard_metrics(MagicMock(), data)
    assert result.trends is not None
    assert result.trends["total_tickets"] == 0


@pytest.mark.asyncio
async def test_handles_empty_data(mock_pod):
    mock_pod.records.list.side_effect = [[], [], [], [], [], [], []]
    data = DashboardMetricsInput()
    result = await dashboard_metrics(MagicMock(), data)
    assert result.tickets_summary["total"] == 0
    assert result.account_health_summary["average_score"] == 0.0
    assert result.followup_summary["total"] == 0