import pytest
from unittest.mock import MagicMock, patch
from src.handler import manage_permission
from src.models import ManagePermissionInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[])
        instance.records.create = MagicMock(return_value={"id": "perm-1"})
        instance.records.delete = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_grants_permission(mock_pod):
    data = ManagePermissionInput(action="grant", role_id="role-1", resource="tickets", permission_action="datastore.record.read")
    result = await manage_permission(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.create.assert_called_once()
    create_args = mock_pod.records.create.call_args[0][1]
    assert create_args["role_id"] == "role-1"
    assert create_args["action"] == "datastore.record.read"


@pytest.mark.asyncio
async def test_revokes_permission(mock_pod):
    mock_pod.records.list.return_value = [{"id": "perm-1"}]
    data = ManagePermissionInput(action="revoke", role_id="role-1", resource="tickets", permission_action="datastore.record.read")
    result = await manage_permission(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.delete.assert_called_once_with("role_permissions", "perm-1")


@pytest.mark.asyncio
async def test_skips_duplicate_grant(mock_pod):
    mock_pod.records.list.return_value = [{"id": "perm-1"}]
    data = ManagePermissionInput(action="grant", role_id="role-1", resource="tickets", permission_action="datastore.record.read")
    result = await manage_permission(MagicMock(), data)
    assert result.status == "success"
    mock_pod.records.create.assert_not_called()
