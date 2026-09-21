import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import list_appointments, ListAppointmentsInput


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list = MagicMock(return_value=[
            {
                "id": "apt-1",
                "customer_id": "cust-1",
                "customer_name": "Alice",
                "technician_id": "tech-1",
                "technician_name": "Bob",
                "service_type": "Plumbing",
                "scheduled_date": "2026-07-01T10:00:00",
                "status": "scheduled",
                "duration_minutes": 60,
                "notes": None,
            },
            {
                "id": "apt-2",
                "customer_id": "cust-2",
                "customer_name": "Charlie",
                "technician_id": None,
                "technician_name": None,
                "service_type": "Electrical",
                "scheduled_date": "2026-07-02T14:00:00",
                "status": "scheduled",
                "duration_minutes": 90,
                "notes": "Call ahead",
            },
        ])
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_lists_all_appointments(mock_pod):
    data = ListAppointmentsInput()
    result = await list_appointments(MagicMock(), data)
    assert result.total == 2
    assert len(result.appointments) == 2
    assert result.appointments[0].appointment_id == "apt-1"
    assert result.appointments[1].appointment_id == "apt-2"


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    data = ListAppointmentsInput(status="scheduled")
    result = await list_appointments(MagicMock(), data)
    assert result.total == 2
    mock_pod.records.list.assert_called_once()
    filters = mock_pod.records.list.call_args[1].get("filters", {})
    assert filters.get("status") == "scheduled"


@pytest.mark.asyncio
async def test_filters_by_date_range(mock_pod):
    data = ListAppointmentsInput(scheduled_date_from=date(2026, 7, 1), scheduled_date_to=date(2026, 7, 31))
    result = await list_appointments(MagicMock(), data)
    assert result.total == 2
    filters = mock_pod.records.list.call_args[1].get("filters", {})
    assert filters.get("scheduled_date_from") == "2026-07-01"
    assert filters.get("scheduled_date_to") == "2026-07-31"


@pytest.mark.asyncio
async def test_respects_limit(mock_pod):
    data = ListAppointmentsInput(limit=1)
    result = await list_appointments(MagicMock(), data)
    assert result.total == 2
    limit = mock_pod.records.list.call_args[1].get("limit")
    assert limit == 1


@pytest.mark.asyncio
async def test_returns_empty_on_exception(mock_pod):
    mock_pod.records.list.side_effect = Exception("DB timeout")
    data = ListAppointmentsInput()
    result = await list_appointments(MagicMock(), data)
    assert result.total == 0
    assert result.appointments == []
