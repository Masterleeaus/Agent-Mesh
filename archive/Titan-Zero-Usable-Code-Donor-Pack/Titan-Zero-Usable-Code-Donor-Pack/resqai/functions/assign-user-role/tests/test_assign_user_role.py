import pytest
from unittest.mock import MagicMock, patch
from src.handler import assign_user_role
from src.models import AssignUserRoleInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(side_effect=lambda table, rid: {
            "users": {"id": "usr-1", "name": "Alice", "role_id": "old-role"},
            "user_roles": {"id": "new-role", "name": "admin"},
        }.get(table))
        instance.records.update = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_assigns_role_successfully(mock_pod):
    data = AssignUserRoleInput(user_id="usr-1", role_id="new-role", assigned_by="admin")
    result = await assign_user_role(MagicMock(), data)
    assert result.status == "success"
    assert result.user_id == "usr-1"
    assert result.role_id == "new-role"
    mock_pod.records.update.assert_called_once()


@pytest.mark.asyncio
async def test_returns_not_found_when_user_missing(mock_pod):
    mock_pod.records.get.side_effect = lambda table, rid: None if table == "users" else {"id": "role-1"}
    data = AssignUserRoleInput(user_id="missing", role_id="role-1", assigned_by="admin")
    result = await assign_user_role(MagicMock(), data)
    assert result.status == "not_found"
    assert "User" in result.error


@pytest.mark.asyncio
async def test_returns_not_found_when_role_missing(mock_pod):
    mock_pod.records.get.side_effect = lambda table, rid: {"id": "usr-1"} if table == "users" else None
    data = AssignUserRoleInput(user_id="usr-1", role_id="missing", assigned_by="admin")
    result = await assign_user_role(MagicMock(), data)
    assert result.status == "not_found"
    assert "Role" in result.error
