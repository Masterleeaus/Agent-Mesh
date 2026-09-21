import pytest
from unittest.mock import MagicMock, patch
from src.handler import list_disputes
from src.models import ListDisputesInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.query = MagicMock(return_value=[
            {"id": "disp-1", "customer_id": "cust-1", "appointment_id": "apt-1",
             "ticket_id": "tkt-1", "status": "open",
             "customer_claim": "Service not completed",
             "provider_claim": "Service was completed",
             "evidence_summary": "Photos show incomplete work",
             "recommended_resolution": "partial_refund",
             "confidence": 0.85, "created_at": "2026-06-01T10:00:00Z"},
            {"id": "disp-2", "customer_id": "cust-2", "appointment_id": None,
             "ticket_id": "tkt-2", "status": "closed",
             "customer_claim": "Billing issue",
             "provider_claim": None,
             "evidence_summary": None,
             "recommended_resolution": "discount_credit",
             "confidence": 0.75, "created_at": "2026-06-10T10:00:00Z"},
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_all_disputes(mock_pod):
    data = ListDisputesInput()
    result = await list_disputes(MagicMock(), data)
    assert result.total == 2
    assert len(result.disputes) == 2


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = ListDisputesInput(status="open")
    await list_disputes(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("disputes", {"status": "open"})


@pytest.mark.asyncio
async def test_filters_by_customer_id(mock_pod):
    data = ListDisputesInput(customer_id="cust-1")
    await list_disputes(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("disputes", {"customer_id": "cust-1"})


@pytest.mark.asyncio
async def test_filters_by_ticket_id(mock_pod):
    data = ListDisputesInput(ticket_id="tkt-1")
    await list_disputes(MagicMock(), data)
    mock_pod.records.query.assert_called_once_with("disputes", {"ticket_id": "tkt-1"})


@pytest.mark.asyncio
async def test_includes_all_dispute_fields(mock_pod):
    data = ListDisputesInput()
    result = await list_disputes(MagicMock(), data)
    dispute = result.disputes[0]
    assert dispute.dispute_id == "disp-1"
    assert dispute.status == "open"
    assert dispute.customer_claim == "Service not completed"
    assert dispute.confidence == 0.85
