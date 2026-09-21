import pytest
from unittest.mock import MagicMock, patch
from src.handler import record_audit
from src.models import RecordAuditInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.create = MagicMock(return_value={"id": "audit-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_records_audit_entry(mock_pod):
    data = RecordAuditInput(
        entity_type="ticket", entity_id="tkt-1", action="updated",
        actor_type="user", actor_id="usr-1",
        previous_state={"status": "new"}, new_state={"status": "classified"},
        changed_fields=["status"],
    )
    result = await record_audit(MagicMock(), data)
    assert result.status == "success"
    assert result.audit_id == "audit-1"


@pytest.mark.asyncio
async def test_records_minimal_audit(mock_pod):
    data = RecordAuditInput(
        entity_type="user", entity_id="usr-1", action="created",
        actor_type="system",
    )
    result = await record_audit(MagicMock(), data)
    assert result.status == "success"
    assert result.audit_id == "audit-1"
    create_args = mock_pod.records.create.call_args[0][1]
    assert create_args["entity_type"] == "user"
    assert create_args["action"] == "created"
    assert create_args["actor_type"] == "system"


@pytest.mark.asyncio
async def test_records_with_correlation_id(mock_pod):
    data = RecordAuditInput(
        entity_type="ticket", entity_id="tkt-1", action="deleted",
        actor_type="user", correlation_id="corr-123",
    )
    result = await record_audit(MagicMock(), data)
    assert result.status == "success"
    create_args = mock_pod.records.create.call_args[0][1]
    assert create_args["correlation_id"] == "corr-123"
