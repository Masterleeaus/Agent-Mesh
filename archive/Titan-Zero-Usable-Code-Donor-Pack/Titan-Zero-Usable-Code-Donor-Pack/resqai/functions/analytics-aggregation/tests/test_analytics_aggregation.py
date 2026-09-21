import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import analytics_aggregation
from src.models import AnalyticsAggregationInput
from datetime import datetime, timezone


def _ts_str(dt):
    return dt.isoformat()


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_computes_metrics(mock_pod):
    now = datetime.now(timezone.utc)
    mock_pod.records.list.side_effect = [
        [
            {"id": "t1", "status": "closed", "urgency": "high", "created_at": _ts_str(now), "closed_at": _ts_str(now)},
            {"id": "t2", "status": "open", "urgency": "low", "created_at": _ts_str(now)},
        ],
        [
            {"appointment_id": "a1", "status": "completed", "scheduled_at": _ts_str(now)},
            {"appointment_id": "a2", "status": "cancelled", "scheduled_at": _ts_str(now)},
        ],
        [{"id": "c1"}, {"id": "c2"}],
        [{"id": "u1", "role": "technician"}, {"id": "u2", "role": "admin"}],
    ]

    data = AnalyticsAggregationInput(period="daily", date_from=date.today())
    result = await analytics_aggregation(MagicMock(), data)
    assert result.period == "daily"
    assert result.metrics.total_tickets == 2
    assert result.metrics.open_tickets == 1
    assert result.metrics.closed_tickets == 1
    assert result.metrics.total_appointments == 2
    assert result.metrics.completed_appointments == 1
    assert result.metrics.cancelled_appointments == 1
    assert result.metrics.total_customers == 2
    assert result.metrics.total_technicians == 1
    assert result.metrics.tickets_by_status["closed"] == 1
    assert result.metrics.tickets_by_urgency["high"] == 1


@pytest.mark.asyncio
async def test_handles_empty_data(mock_pod):
    mock_pod.records.list.side_effect = [[], [], [], []]
    data = AnalyticsAggregationInput(period="monthly", date_from=date.today())
    result = await analytics_aggregation(MagicMock(), data)
    assert result.metrics.total_tickets == 0
    assert result.metrics.avg_resolution_time_hours == 0.0
    assert result.metrics.total_customers == 0
    assert result.metrics.total_technicians == 0