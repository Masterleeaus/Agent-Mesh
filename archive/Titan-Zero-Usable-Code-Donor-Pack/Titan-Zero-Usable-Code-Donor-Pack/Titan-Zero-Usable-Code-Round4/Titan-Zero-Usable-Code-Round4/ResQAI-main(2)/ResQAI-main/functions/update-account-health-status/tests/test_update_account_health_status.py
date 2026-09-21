import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import update_account_health_status, UpdateAccountHealthStatusInput


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
        "health_category": "healthy",
        "coordination_status": "ok",
        "today": date(2026, 6, 28),
    }
    if overrides:
        base.update(overrides)
    return UpdateAccountHealthStatusInput(**base)


@pytest.mark.asyncio
async def test_logs_audit_entry(mock_pod):
    data = make_data()
    result = await update_account_health_status(MagicMock(), data)
    assert result.status == "completed"
    assert result.audit_logged is True
    mock_pod.records.create.assert_called_once()
    log_args = mock_pod.records.create.call_args[0]
    assert log_args[0] == "operations_log"
    assert log_args[1]["action"] == "account_health_monitor workflow"


@pytest.mark.asyncio
async def test_includes_summary_in_audit(mock_pod):
    data = make_data({"summary": "All accounts healthy"})
    await update_account_health_status(MagicMock(), data)
    log_result = mock_pod.records.create.call_args[0][1]["result"]
    assert "All accounts healthy" in log_result


@pytest.mark.asyncio
async def test_sends_discord_alert_for_critical(mock_pod):
    data = make_data({"health_category": "critical", "summary": "Account at risk of churn"})
    await update_account_health_status(MagicMock(), data)
    mock_pod.connectors.execute.assert_called_once()


@pytest.mark.asyncio
async def test_skips_discord_for_healthy(mock_pod):
    data = make_data({"health_category": "healthy"})
    await update_account_health_status(MagicMock(), data)
    mock_pod.connectors.execute.assert_not_called()


@pytest.mark.asyncio
async def test_skips_discord_for_warning(mock_pod):
    data = make_data({"health_category": "warning"})
    await update_account_health_status(MagicMock(), data)
    mock_pod.connectors.execute.assert_not_called()


@pytest.mark.asyncio
async def test_includes_recovery_notes(mock_pod):
    data = make_data({"health_category": "critical", "recovery_notes": "Call customer ASAP"})
    await update_account_health_status(MagicMock(), data)
    log_result = mock_pod.records.create.call_args[0][1]["result"]
    assert "Recovery: Call customer ASAP" in log_result
