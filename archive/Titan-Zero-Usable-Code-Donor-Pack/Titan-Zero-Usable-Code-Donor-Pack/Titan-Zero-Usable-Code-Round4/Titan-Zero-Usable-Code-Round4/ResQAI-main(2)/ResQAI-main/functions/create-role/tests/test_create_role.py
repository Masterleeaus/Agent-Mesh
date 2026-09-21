import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_role
from src.models import CreateRoleInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[])
        instance.records.create = MagicMock(return_value={"id": "role-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_role_successfully(mock_pod):
    data = CreateRoleInput(name="admin", description="Administrator role")
    result = await create_role(MagicMock(), data)
    assert result.status == "success"
    assert result.role_id == "role-1"


@pytest.mark.asyncio
async def test_rejects_duplicate_name(mock_pod):
    mock_pod.records.list.return_value = [{"id": "role-0", "name": "admin"}]
    data = CreateRoleInput(name="admin")
    result = await create_role(MagicMock(), data)
    assert result.status == "error"
    assert "already exists" in result.error


@pytest.mark.asyncio
async def test_creates_system_role(mock_pod):
    data = CreateRoleInput(name="superadmin", is_system=True)
    result = await create_role(MagicMock(), data)
    assert result.status == "success"
    create_args = mock_pod.records.create.call_args[0][1]
    assert create_args["is_system"] is True
