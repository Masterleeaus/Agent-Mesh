import pytest
from unittest.mock import MagicMock, patch
from src.handler import update_user
from src.models import UpdateUserInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "usr-1", "name": "Alice", "status": "active"})
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_updates_user_fields(mock_pod):
    data = UpdateUserInput(user_id="usr-1", name="Alice Updated", status="suspended")
    result = await update_user(MagicMock(), data)
    assert result.status == "success"
    assert result.user_id == "usr-1"
    mock_pod.records.update.assert_called_once()
    update_args = mock_pod.records.update.call_args[0]
    assert update_args[1] == "usr-1"
    assert update_args[2]["name"] == "Alice Updated"
    assert update_args[2]["status"] == "suspended"


@pytest.mark.asyncio
async def test_returns_not_found_when_user_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = UpdateUserInput(user_id="missing", name="Ghost")
    result = await update_user(MagicMock(), data)
    assert result.status == "not_found"
    assert result.error == "User missing not found"


@pytest.mark.asyncio
async def test_skips_update_when_no_fields_provided(mock_pod):
    data = UpdateUserInput(user_id="usr-1")
    result = await update_user(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.update.assert_not_called()
