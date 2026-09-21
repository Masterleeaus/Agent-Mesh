import pytest
from src.handler import handle
from src.models import CheckTicketUrgencyInput


def test_urgent_routes_to_skip_coordination():
    for urgency in ("urgent", "high"):
        result = handle(CheckTicketUrgencyInput(ticket_id="abc", urgency=urgency))
        assert result.routing == urgency
        assert result.is_urgent is True


def test_normal_routes_through_coordination():
    for urgency in ("normal", "low"):
        result = handle(CheckTicketUrgencyInput(ticket_id="abc", urgency=urgency))
        assert result.routing == urgency
        assert result.is_urgent is False


def test_echoes_ticket_id():
    result = handle(CheckTicketUrgencyInput(ticket_id="test-uuid-123", urgency="high"))
    assert result.ticket_id == "test-uuid-123"
