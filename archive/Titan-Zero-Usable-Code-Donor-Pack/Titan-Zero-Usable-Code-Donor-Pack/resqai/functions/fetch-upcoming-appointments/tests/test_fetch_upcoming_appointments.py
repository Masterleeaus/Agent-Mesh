import pytest
from unittest.mock import MagicMock, patch
from datetime import date
from src.handler import fetch_upcoming_appointments, FetchUpcomingAppointmentsInput


def make_appt(overrides=None):
    base = {
        "id": "appt-1", "customer_id": "cust-1", "customer_name": "Alice",
        "technician": "Bob", "status": "confirmed", "scheduled_date": "2026-06-29",
        "scheduled_time": "10:00", "service_type": "repair", "notes": None, "location": "HQ",
    }
    if overrides:
        base.update(overrides)
    return base


@pytest.fixture
def mock_pod():
    with patch("src.handler.Pod") as mock:
        instance = MagicMock()
        instance.records.list.return_value.to_dict.return_value = {"items": [make_appt()]}
        mock.from_env.return_value = instance
        yield instance


@pytest.mark.asyncio
async def test_returns_only_appointments_in_window(mock_pod):
    mock_pod.records.list.return_value.to_dict.return_value = {
        "items": [
            make_appt({"id": "a1", "status": "confirmed", "scheduled_date": "2026-06-29"}),
            make_appt({"id": "a2", "status": "confirmed", "scheduled_date": "2026-07-05"}),
            make_appt({"id": "a3", "status": "scheduled", "scheduled_date": "2026-06-30"}),
        ]
    }
    data = FetchUpcomingAppointmentsInput(today=date(2026, 6, 28), days_ahead=2)
    result = await fetch_upcoming_appointments(MagicMock(), data)
    assert result.count == 2
    assert [a.appointment_id for a in result.appointments] == ["a1", "a3"]


@pytest.mark.asyncio
async def test_filters_by_status(mock_pod):
    mock_pod.records.list.return_value.to_dict.return_value = {
        "items": [
            make_appt({"id": "a1", "status": "confirmed", "scheduled_date": "2026-06-29"}),
            make_appt({"id": "a2", "status": "cancelled", "scheduled_date": "2026-06-29"}),
        ]
    }
    data = FetchUpcomingAppointmentsInput(today=date(2026, 6, 28), days_ahead=2)
    result = await fetch_upcoming_appointments(MagicMock(), data)
    assert result.count == 1
    assert result.appointments[0].appointment_id == "a1"


@pytest.mark.asyncio
async def test_returns_empty_when_none_match(mock_pod):
    mock_pod.records.list.return_value.to_dict.return_value = {"items": []}
    data = FetchUpcomingAppointmentsInput(today=date(2026, 6, 28), days_ahead=2)
    result = await fetch_upcoming_appointments(MagicMock(), data)
    assert result.count == 0
    assert result.appointments == []
