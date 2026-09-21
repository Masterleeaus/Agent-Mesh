import pytest
from unittest.mock import MagicMock, patch
from src.handler import track_notification
from src.models import TrackNotificationInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock()
        instance.records.list = MagicMock()
        instance.records.update = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_finds_by_notification_id(mock_pod):
    expected = {"notification_id": "n-1", "status": "sent", "subject": "Test"}
    mock_pod.records.get.return_value = expected
    data = TrackNotificationInput(notification_id="n-1")
    result = await track_notification(MagicMock(), data)
    assert result.status == "success"
    assert result.notification["notification_id"] == "n-1"


@pytest.mark.asyncio
async def test_finds_by_correlation_id(mock_pod):
    expected = {"notification_id": "n-1", "status": "sent", "correlation_id": "corr-1"}
    mock_pod.records.list.return_value = [expected]
    data = TrackNotificationInput(correlation_id="corr-1")
    result = await track_notification(MagicMock(), data)
    assert result.status == "success"
    assert result.notification["correlation_id"] == "corr-1"


@pytest.mark.asyncio
async def test_returns_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    mock_pod.records.list.return_value = []
    data = TrackNotificationInput(notification_id="missing")
    result = await track_notification(MagicMock(), data)
    assert result.status == "not_found"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_marks_as_read(mock_pod):
    mock_pod.records.get.return_value = {"notification_id": "n-1", "status": "sent"}
    data = TrackNotificationInput(notification_id="n-1", mark_read=True)
    result = await track_notification(MagicMock(), data)
    assert result.status == "success"
    assert result.notification["status"] == "read"
    mock_pod.records.update.assert_called_once()


@pytest.mark.asyncio
async def test_skips_mark_read_if_already_read(mock_pod):
    mock_pod.records.get.return_value = {"notification_id": "n-1", "status": "read"}
    data = TrackNotificationInput(notification_id="n-1", mark_read=True)
    result = await track_notification(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.update.assert_not_called()