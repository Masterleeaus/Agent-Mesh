import pytest
from unittest.mock import MagicMock, patch
from src.handler import dispatch_notifications, DispatchNotificationsInput, Reminder


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.connectors.execute = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


def make_reminder(overrides=None):
    base = Reminder(
        appointment_id="appt-1",
        customer_id="cust-1",
        customer_name="Alice",
        channel="email",
        recipient="alice@test.com",
        message="Your appointment is tomorrow at 10am.",
    )
    if overrides:
        for k, v in overrides.items():
            setattr(base, k, v)
    return base


@pytest.mark.asyncio
async def test_dispatches_all_reminders(mock_pod):
    data = DispatchNotificationsInput(
        reminders=[make_reminder(), make_reminder(appointment_id="appt-2")],
        channels=["email"],
    )
    result = await dispatch_notifications(MagicMock(), data)
    assert result.dispatched == 2
    assert len(result.failures) == 0
    assert mock_pod.connectors.execute.call_count == 2


@pytest.mark.asyncio
async def test_reports_failures(mock_pod):
    mock_pod.connectors.execute.side_effect = Exception("SMTP error")
    data = DispatchNotificationsInput(
        reminders=[make_reminder()],
        channels=["email"],
    )
    result = await dispatch_notifications(MagicMock(), data)
    assert result.dispatched == 0
    assert len(result.failures) == 1
    assert "SMTP error" in result.failures[0]["reason"]


@pytest.mark.asyncio
async def test_skips_disallowed_channels(mock_pod):
    data = DispatchNotificationsInput(
        reminders=[make_reminder(channel="sms")],
        channels=["email"],
    )
    result = await dispatch_notifications(MagicMock(), data)
    assert result.dispatched == 0
    assert len(result.failures) == 1
    assert "not in allowed channels" in result.failures[0]["reason"]


@pytest.mark.asyncio
async def test_handles_empty_reminders(mock_pod):
    data = DispatchNotificationsInput(reminders=[], channels=["email", "sms"])
    result = await dispatch_notifications(MagicMock(), data)
    assert result.dispatched == 0
    assert result.failures == []
