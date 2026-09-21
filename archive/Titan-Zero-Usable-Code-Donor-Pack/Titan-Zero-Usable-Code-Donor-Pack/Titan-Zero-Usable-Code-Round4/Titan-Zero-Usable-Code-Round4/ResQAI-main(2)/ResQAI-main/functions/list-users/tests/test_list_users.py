import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_users
from src.models import ListUsersInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[
            {"id": "usr-1", "email": "alice@test.com", "name": "Alice", "role_id": "admin", "status": "active", "created_at": "2025-01-01T00:00:00"},
            {"id": "usr-2", "email": "bob@test.com", "name": "Bob", "role_id": "tech", "status": "active", "created_at": "2025-01-02T00:00:00"},
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_lists_all_users(mock_pod):
    data = ListUsersInput()
    result = await list_users(MagicMock(), data)
    assert result.total == 2
    assert len(result.users) == 2
    assert result.users[0].email == "alice@test.com"


@pytest.mark.asyncio
async def test_filters_by_role(mock_pod):
    data = ListUsersInput(role_id="tech")
    result = await list_users(MagicMock(), data)
    mock_pod.records.list.assert_called_once_with("users", {"role_id": "tech"}, limit=100)
    assert result.total == 2


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = ListUsersInput(status="active")
    result = await list_users(MagicMock(), data)
    mock_pod.records.list.assert_called_once_with("users", {"status": "active"}, limit=100)
    assert result.total == 2


@pytest.mark.asyncio
async def test_honours_limit(mock_pod):
    data = ListUsersInput(limit=5)
    result = await list_users(MagicMock(), data)
    mock_pod.records.list.assert_called_once_with("users", {}, limit=5)
