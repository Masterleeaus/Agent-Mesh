import pytest
from unittest.mock import MagicMock, patch
from src.handler import authenticate_user
from src.models import AuthenticateUserInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[{"id": "usr-1", "email": "alice@test.com", "name": "Alice", "role_id": "admin", "auth_provider": "google", "auth_provider_id": "g-123"}])
        instance.records.get = MagicMock()
        instance.records.update = MagicMock()
        instance.records.create = MagicMock(return_value={"id": "sess-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_authenticates_successfully(mock_pod):
    data = AuthenticateUserInput(email="alice@test.com", auth_provider="google", auth_provider_id="g-123")
    result = await authenticate_user(MagicMock(), data)
    assert result.status == "success"
    assert result.user_id == "usr-1"
    assert result.token == "sess-1"
    assert result.name == "Alice"
    mock_pod.records.update.assert_called_once()
    mock_pod.records.create.assert_called()


@pytest.mark.asyncio
async def test_returns_error_when_user_not_found(mock_pod):
    mock_pod.records.list.return_value = []
    data = AuthenticateUserInput(email="unknown@test.com")
    result = await authenticate_user(MagicMock(), data)
    assert result.status == "error"
    assert result.error == "User not found"


@pytest.mark.asyncio
async def test_returns_error_on_auth_provider_mismatch(mock_pod):
    data = AuthenticateUserInput(email="alice@test.com", auth_provider="microsoft", auth_provider_id="m-456")
    result = await authenticate_user(MagicMock(), data)
    assert result.status == "error"
    assert result.error == "Auth provider mismatch"
