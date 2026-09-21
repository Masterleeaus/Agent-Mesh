import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_permissions
from src.models import ListPermissionsInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[
            {"id": "perm-1", "role_id": "role-1", "resource": "tickets", "action": "datastore.record.read", "scope": "own"},
            {"id": "perm-2", "role_id": "role-2", "resource": "users", "action": "datastore.record.write", "scope": "all"},
        ])
        instance.records.get = MagicMock(side_effect=lambda table, rid: {
            "role-1": {"id": "role-1", "name": "admin"},
            "role-2": {"id": "role-2", "name": "manager"},
        }.get(rid))
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_lists_all_permissions(mock_pod):
    data = ListPermissionsInput()
    result = await list_permissions(MagicMock(), data)
    assert result.total == 2
    assert result.permissions[0].role_name == "admin"
    assert result.permissions[1].role_name == "manager"


@pytest.mark.asyncio
async def test_filters_by_role(mock_pod):
    data = ListPermissionsInput(role_id="role-1")
    result = await list_permissions(MagicMock(), data)
    mock_pod.records.list.assert_called_once_with("role_permissions", {"role_id": "role-1"}, limit=200)
    assert result.total == 2


@pytest.mark.asyncio
async def test_filters_by_resource(mock_pod):
    data = ListPermissionsInput(resource="tickets")
    result = await list_permissions(MagicMock(), data)
    mock_pod.records.list.assert_called_once_with("role_permissions", {"resource": "tickets"}, limit=200)
    assert result.total == 2
