import pytest
from unittest.mock import MagicMock, patch
from src.handler import send_bulk_notification
from src.models import SendBulkNotificationInput, BulkNotificationRecipient


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.connectors.execute = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


def make_recipient(overrides=None):
    base = BulkNotificationRecipient(
        recipient_id="user-1",
        recipient_type="user",
        channel="in_app",
        recipient_address="user-1",
    )
    if overrides:
        for k, v in overrides.items():
            setattr(base, k, v)
    return base


@pytest.mark.asyncio
async def test_dispatches_all_recipients(mock_pod):
    data = SendBulkNotificationInput(
        notification_type="alert",
        subject_template="Alert",
        body_template="System alert",
        recipients=[make_recipient(), make_recipient(recipient_id="user-2")],
    )
    result = await send_bulk_notification(MagicMock(), data)
    assert result.total_dispatched == 2
    assert len(result.results) == 2
    assert all(r.status == "sent" for r in result.results)


@pytest.mark.asyncio
async def test_handles_failures(mock_pod):
    mock_pod.connectors.execute.side_effect = Exception("Dispatch error")
    data = SendBulkNotificationInput(
        notification_type="alert",
        subject_template="Alert",
        body_template="Test",
        recipients=[make_recipient(channel="email", recipient_address="a@b.com")],
    )
    result = await send_bulk_notification(MagicMock(), data)
    assert result.total_dispatched == 0
    assert result.results[0].status == "failed"
    assert "Dispatch error" in result.results[0].error


@pytest.mark.asyncio
async def test_mixed_results(mock_pod):
    call_count = [0]

    def side_effect(*args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            return
        raise Exception("SMTP error")

    mock_pod.connectors.execute.side_effect = side_effect
    data = SendBulkNotificationInput(
        notification_type="alert",
        subject_template="Alert",
        body_template="Test",
        recipients=[
            make_recipient(channel="email", recipient_address="a@b.com"),
            make_recipient(recipient_id="user-2", channel="email", recipient_address="b@c.com"),
        ],
    )
    result = await send_bulk_notification(MagicMock(), data)
    assert result.total_dispatched == 1
    assert result.results[0].status == "sent"
    assert result.results[1].status == "failed"


@pytest.mark.asyncio
async def test_handles_empty_recipients(mock_pod):
    data = SendBulkNotificationInput(
        notification_type="alert",
        subject_template="Alert",
        body_template="Test",
        recipients=[],
    )
    result = await send_bulk_notification(MagicMock(), data)
    assert result.total_dispatched == 0
    assert result.results == []