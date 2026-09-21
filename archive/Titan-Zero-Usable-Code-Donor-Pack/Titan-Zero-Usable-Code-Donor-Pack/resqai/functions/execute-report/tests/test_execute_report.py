import pytest
from unittest.mock import MagicMock, patch
from src.handler import execute_report
from src.models import ExecuteReportInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "rpt-1",
            "name": "Ticket Count",
            "config": {
                "tables": [
                    {
                        "name": "tickets",
                        "filters": {"status": "closed"},
                        "metrics": [{"name": "total", "type": "count"}],
                        "limit": 500,
                    }
                ]
            },
        })
        instance.records.list = MagicMock(return_value=[
            {"id": "tkt-1", "status": "closed"},
            {"id": "tkt-2", "status": "closed"},
        ])
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_executes_report_successfully(mock_pod):
    data = ExecuteReportInput(report_id="rpt-1")
    result = await execute_report(MagicMock(), data)
    assert result.status == "success"
    assert result.report_id == "rpt-1"
    assert result.data["tickets"]["total"] == 2


@pytest.mark.asyncio
async def test_returns_not_found_when_report_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = ExecuteReportInput(report_id="missing")
    result = await execute_report(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_executes_with_params_override(mock_pod):
    data = ExecuteReportInput(report_id="rpt-1", params={"filters": {"status": "open"}})
    result = await execute_report(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.list.assert_called_once()
    list_filters = mock_pod.records.list.call_args[0][1]
    assert list_filters["status"] == "open"


@pytest.mark.asyncio
async def test_returns_generated_at_timestamp(mock_pod):
    data = ExecuteReportInput(report_id="rpt-1")
    result = await execute_report(MagicMock(), data)
    assert result.status == "success"
    assert "generated_at" in result.model_dump()
    assert result.generated_at is not None
