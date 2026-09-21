import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_report
from src.models import CreateReportInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock(return_value={"id": "rpt-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_report_successfully(mock_pod):
    data = CreateReportInput(name="Monthly Tickets", config={"table": "tickets", "metrics": ["count"]})
    result = await create_report(MagicMock(), data)
    assert result.status == "success"
    assert result.report_id == "rpt-1"


@pytest.mark.asyncio
async def test_creates_public_report(mock_pod):
    data = CreateReportInput(name="Public Dashboard", config={}, is_public=True)
    result = await create_report(MagicMock(), data)
    assert result.status == "success"
    create_args = mock_pod.records.create.call_args[0][1]
    assert create_args["is_public"] is True
    assert create_args["name"] == "Public Dashboard"
