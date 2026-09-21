import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from src.handler import validate_session
from src.models import ValidateSessionInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_validates_active_session(mock_pod):
    future = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    mock_pod.records.get.return_value = {"id": "sess-1", "user_id": "usr-1", "expires_at": future, "is_invalidated": False}
    data = ValidateSessionInput(session_id="sess-1")
    result = await validate_session(MagicMock(), data)
    assert result.valid is True
    assert result.user_id == "usr-1"


@pytest.mark.asyncio
async def test_returns_invalid_when_session_not_found(mock_pod):
    mock_pod.records.get.return_value = None
    data = ValidateSessionInput(session_id="missing")
    result = await validate_session(MagicMock(), data)
    assert result.valid is False
    assert result.error == "Session not found"


@pytest.mark.asyncio
async def test_returns_invalid_when_session_expired(mock_pod):
    past = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    mock_pod.records.get.return_value = {"id": "sess-1", "user_id": "usr-1", "expires_at": past, "is_invalidated": False}
    data = ValidateSessionInput(session_id="sess-1")
    result = await validate_session(MagicMock(), data)
    assert result.valid is False
    assert "expired" in result.error


@pytest.mark.asyncio
async def test_returns_invalid_when_session_invalidated(mock_pod):
    future = (datetime.utcnow() + timedelta(hours=1)).isoformat()
    mock_pod.records.get.return_value = {"id": "sess-1", "user_id": "usr-1", "expires_at": future, "is_invalidated": True}
    data = ValidateSessionInput(session_id="sess-1")
    result = await validate_session(MagicMock(), data)
    assert result.valid is False
    assert "invalidated" in result.error
