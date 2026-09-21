import pytest
from unittest.mock import MagicMock, patch
from src.handler import dispatch_notification_v2
from src.models import DispatchNotificationV2Input


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.connectors.execute = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_dispatches_in_app(mock_pod):
    data = DispatchNotificationV2Input(
        recipient_id="user-1",
        recipient_type="user",
        notification_type="alert",
        channel="in_app",
        subject="Test",
        body="Hello",
    )
    result = await dispatch_notification_v2(MagicMock(), data)
    assert result.status == "sent"
    assert result.notification_id is not None
    assert mock_pod.connectors.execute.call_count == 0


@pytest.mark.asyncio
async def test_dispatches_email(mock_pod):
    data = DispatchNotificationV2Input(
        recipient_id="user@test.com",
        recipient_type="customer",
        notification_type="reminder",
        channel="email",
        subject="Reminder",
        body="Your appointment is tomorrow.",
    )
    result = await dispatch_notification_v2(MagicMock(), data)
    assert result.status == "sent"
    mock_pod.connectors.execute.assert_called_once()


@pytest.mark.asyncio
async def test_handles_dispatch_failure(mock_pod):
    mock_pod.connectors.execute.side_effect = Exception("SMTP error")
    data = DispatchNotificationV2Input(
        recipient_id="user@test.com",
        recipient_type="customer",
        notification_type="reminder",
        channel="email",
        subject="Reminder",
        body="Hello",
    )
    result = await dispatch_notification_v2(MagicMock(), data)
    assert result.status == "failed"
    assert "SMTP error" in result.error


@pytest.mark.asyncio
async def test_creates_notification_record(mock_pod):
    data = DispatchNotificationV2Input(
        recipient_id="user-1",
        recipient_type="user",
        notification_type="alert",
        channel="in_app",
        subject="Test",
        body="Hello",
    )
    result = await dispatch_notification_v2(MagicMock(), data)
    call_args = mock_pod.records.create.call_args_list[0][1]
    assert call_args["notification_id"] == result.notification_id
    assert call_args["status"] == "sent"