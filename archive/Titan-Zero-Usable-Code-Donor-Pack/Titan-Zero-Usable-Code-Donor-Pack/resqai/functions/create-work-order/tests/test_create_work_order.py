import pytest
from unittest.mock import MagicMock, patch
from src.handler import create_work_order
from src.models import CreateWorkOrderInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.get = MagicMock()
        instance.records.create = MagicMock()
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_creates_work_order_successfully(mock_pod):
    mock_pod.records.get.return_value = {"appointment_id": "appt-1"}
    data = CreateWorkOrderInput(
        appointment_id="appt-1",
        technician_id="tech-1",
        customer_id="cust-1",
        service_description="Install new router",
    )
    result = await create_work_order(MagicMock(), data)
    assert result.status == "success"
    assert result.work_order_id is not None
    assert mock_pod.records.create.call_count == 2


@pytest.mark.asyncio
async def test_returns_not_found_when_appointment_missing(mock_pod):
    mock_pod.records.get.return_value = None
    data = CreateWorkOrderInput(
        appointment_id="missing-appt",
        technician_id="tech-1",
        customer_id="cust-1",
        service_description="Test",
    )
    result = await create_work_order(MagicMock(), data)
    assert result.status == "not_found"
    assert result.work_order_id is None
    assert "not found" in result.error