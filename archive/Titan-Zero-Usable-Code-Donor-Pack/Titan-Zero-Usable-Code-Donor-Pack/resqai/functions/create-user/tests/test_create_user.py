import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_user
from src.models import CreateUserInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[])
        instance.records.create = MagicMock(return_value={"id": "usr-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_user_successfully(mock_pod):
    data = CreateUserInput(email="bob@test.com", name="Bob", role_id="role-1")
    result = await create_user(MagicMock(), data)
    assert result.status == "success"
    assert result.user_id == "usr-1"


@pytest.mark.asyncio
async def test_rejects_invalid_email(mock_pod):
    data = CreateUserInput(email="notanemail", name="Bob", role_id="role-1")
    result = await create_user(MagicMock(), data)
    assert result.status == "error"
    assert "Invalid email" in result.error


@pytest.mark.asyncio
async def test_rejects_duplicate_email(mock_pod):
    mock_pod.records.list.return_value = [{"id": "usr-0", "email": "bob@test.com"}]
    data = CreateUserInput(email="bob@test.com", name="Bob", role_id="role-1")
    result = await create_user(MagicMock(), data)
    assert result.status == "error"
    assert "already exists" in result.error


@pytest.mark.asyncio
async def test_creates_user_with_preferences(mock_pod):
    data = CreateUserInput(email="carol@test.com", name="Carol", role_id="role-2", preferences_config={"theme": "dark"})
    result = await create_user(MagicMock(), data)
    assert result.status == "success"
    create_call = mock_pod.records.create.call_args_list[0]
    assert create_call[0][1].get("preferences_config") == {"theme": "dark"}
