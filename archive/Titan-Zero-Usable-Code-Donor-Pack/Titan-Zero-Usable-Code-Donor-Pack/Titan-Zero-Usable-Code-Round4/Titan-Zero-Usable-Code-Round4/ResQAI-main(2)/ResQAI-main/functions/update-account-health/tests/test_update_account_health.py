import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_account_health
from src.models import UpdateAccountHealthInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={
            "id": "acc-1", "health": "healthy", "health_score": 0.9,
        })
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_health(mock_pod):
    data = UpdateAccountHealthInput(account_id="acc-1", health_score=0.4, health="critical")
    result = await update_account_health(MagicMock(), data)
    assert result.status == "success"
    assert result.health_before == "healthy"
    assert result.health_after == "critical"
    mock_pod.records.update.assert_called_once_with("accounts", "acc-1", {
        "health": "critical",
        "health_score": 0.4,
        "updated_at": mock_pod.records.update.call_args[0][2]["updated_at"],
    })


@pytest.mark.asyncio
async def test_creates_health_scan_record(mock_pod):
    data = UpdateAccountHealthInput(account_id="acc-1", health_score=0.6, health="watch", scan_notes="Aging followups")
    await update_account_health(MagicMock(), data)
    scan_call = mock_pod.records.create.call_args_list[0]
    assert scan_call[0][0] == "account_health_scans"
    assert scan_call[0][1]["health_before"] == "healthy"
    assert scan_call[0][1]["health_after"] == "watch"
    assert scan_call[0][1]["scan_notes"] == "Aging followups"


@pytest.mark.asyncio
async def test_returns_error_when_account_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateAccountHealthInput(account_id="missing", health_score=0.5, health="watch")
    result = await update_account_health(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_writes_operations_log(mock_pod):
    data = UpdateAccountHealthInput(account_id="acc-1", health_score=0.3, health="critical", triggered_by="health-scan")
    await update_account_health(MagicMock(), data)
    log_call = mock_pod.records.create.call_args_list[1]
    assert log_call[0][0] == "operations_log"
    assert log_call[0][1]["action"] == "update_account_health"
    assert log_call[0][1]["actor"] == "health-scan"


@pytest.mark.asyncio
async def test_records_old_health(mock_pod):
    data = UpdateAccountHealthInput(account_id="acc-1", health_score=0.2, health="critical")
    result = await update_account_health(MagicMock(), data)
    assert result.health_before == "healthy"
    assert result.health_after == "critical"


@pytest.mark.asyncio
async def test_handles_non_degrading_health(mock_pod):
    mock_pod.records.get.return_value = {
        "id": "acc-2", "health": "watch", "health_score": 0.6,
    }
    data = UpdateAccountHealthInput(account_id="acc-2", health_score=0.8, health="healthy")
    result = await update_account_health(MagicMock(), data)
    assert result.health_before == "watch"
    assert result.health_after == "healthy"
    scan_call = mock_pod.records.create.call_args_list[0]
    assert scan_call[0][1]["risk_factors"] == []
