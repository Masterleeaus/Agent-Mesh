import pytest
from unittest.mock import MagicMock, patch
from src.handler import schedule_report
from src.models import ScheduleReportInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "rpt-1", "name": "Monthly Summary"})
        instance.records.create = MagicMock(return_value={"id": "sched-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_schedules_report_successfully(mock_pod):
    data = ScheduleReportInput(report_id="rpt-1", frequency="daily", recipients=["admin@test.com"])
    result = await schedule_report(MagicMock(), data)
    assert result.status == "success"
    assert result.schedule_id == "sched-1"


@pytest.mark.asyncio
async def test_returns_not_found_when_report_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = ScheduleReportInput(report_id="missing", frequency="daily", recipients=["admin@test.com"])
    result = await schedule_report(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_creates_schedule_with_next_run(mock_pod):
    data = ScheduleReportInput(report_id="rpt-1", frequency="weekly", recipients=["a@b.com"])
    result = await schedule_report(MagicMock(), data)
    assert result.status == "success"
    create_args = mock_pod.records.create.call_args_list[0][0][1]
    assert create_args["frequency"] == "weekly"
    assert "next_scheduled_at" in create_args
    assert create_args["recipients"] == ["a@b.com"]
