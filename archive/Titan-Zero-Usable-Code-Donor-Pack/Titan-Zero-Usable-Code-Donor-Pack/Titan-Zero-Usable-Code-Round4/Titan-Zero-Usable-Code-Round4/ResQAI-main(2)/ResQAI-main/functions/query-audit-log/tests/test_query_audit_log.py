import pytest
from unittest.mock import MagicMock, patch
from src.handler import query_audit_log
from src.models import QueryAuditLogInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[
            {"id": "audit-1", "entity_type": "ticket", "entity_id": "tkt-1", "action": "updated", "actor_type": "user", "actor_id": "usr-1", "changed_fields": ["status"], "created_at": "2025-01-02T00:00:00"},
            {"id": "audit-2", "entity_type": "ticket", "entity_id": "tkt-1", "action": "created", "actor_type": "system", "actor_id": None, "changed_fields": [], "created_at": "2025-01-01T00:00:00"},
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_queries_all_audit_entries(mock_pod):
    data = QueryAuditLogInput()
    result = await query_audit_log(MagicMock(), data)
    assert result.total == 2
    assert len(result.entries) == 2
    assert result.entries[0].audit_id == "audit-1"


@pytest.mark.asyncio
async def test_filters_by_entity_type(mock_pod):
    data = QueryAuditLogInput(entity_type="ticket")
    result = await query_audit_log(MagicMock(), data)
    mock_pod.records.list.assert_called_once()
    assert result.total == 2


@pytest.mark.asyncio
async def test_filters_by_action(mock_pod):
    data = QueryAuditLogInput(action="created")
    result = await query_audit_log(MagicMock(), data)
    assert result.total == 2


@pytest.mark.asyncio
async def test_honours_pagination(mock_pod):
    data = QueryAuditLogInput(limit=10, offset=5)
    result = await query_audit_log(MagicMock(), data)
    assert result.total == 2


@pytest.mark.asyncio
async def test_filters_by_correlation_id(mock_pod):
    data = QueryAuditLogInput(correlation_id="corr-123")
    result = await query_audit_log(MagicMock(), data)
    mock_pod.records.list.assert_called_once_with("audit_log", {"correlation_id": "corr-123"}, limit=100, offset=0, order_by="-created_at")
    assert result.total == 2
