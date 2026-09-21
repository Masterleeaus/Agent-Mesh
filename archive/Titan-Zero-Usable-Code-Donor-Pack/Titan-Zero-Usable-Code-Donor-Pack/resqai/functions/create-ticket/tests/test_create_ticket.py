import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_ticket, CreateTicketInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value=None)
        instance.records.create = MagicMock(return_value={"id": "ticket-001"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_ticket_successfully(mock_pod):
    data = CreateTicketInput(
        customer_id="cust-1",
        channel="email",
        subject="AC not working",
        message="Unit is blowing warm air.",
        urgency="high",
        created_by="alice",
    )
    result = await create_ticket(MagicMock(), data)
    assert result.status == "success"
    assert result.ticket_id == "ticket-001"
    assert mock_pod.records.create.call_count == 3


@pytest.mark.asyncio
async def test_validates_required_fields(mock_pod):
    data = CreateTicketInput(
        customer_id="",
        channel="",
        subject="",
        message="",
    )
    result = await create_ticket(MagicMock(), data)
    assert result.status == "error"
    assert "Missing required fields" in result.error
    assert mock_pod.records.create.call_count == 0


@pytest.mark.asyncio
async def test_handles_db_error(mock_pod):
    mock_pod.records.create.side_effect = Exception("Database connection failed")
    data = CreateTicketInput(
        customer_id="cust-1",
        channel="phone",
        subject="Leaky faucet",
        message="Kitchen sink leaking.",
    )
    with pytest.raises(Exception):
        await create_ticket(MagicMock(), data)
