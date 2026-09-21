import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_appointment, CreateAppointmentInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock(return_value={"id": "cust-1", "name": "Alice"})
        instance.records.create = MagicMock(return_value={"id": "apt-1"})
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_appointment_successfully(mock_pod):
    data = CreateAppointmentInput(
        customer_id="cust-1",
        service_type="Plumbing",
        scheduled_date="2026-07-01T10:00:00",
    )
    result = await create_appointment(MagicMock(), data)
    assert result.status == "success"
    assert result.appointment_id == "apt-1"
    mock_pod.records.create.assert_called()


@pytest.mark.asyncio
async def test_returns_error_when_customer_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = CreateAppointmentInput(
        customer_id="missing",
        service_type="Plumbing",
        scheduled_date="2026-07-01T10:00:00",
    )
    result = await create_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "not found" in result.error


@pytest.mark.asyncio
async def test_handles_exception_gracefully(mock_pod):
    mock_pod.records.get.side_effect = Exception("DB timeout")
    data = CreateAppointmentInput(
        customer_id="cust-1",
        service_type="Plumbing",
        scheduled_date="2026-07-01T10:00:00",
    )
    result = await create_appointment(MagicMock(), data)
    assert result.status == "error"
    assert "DB timeout" in result.error
