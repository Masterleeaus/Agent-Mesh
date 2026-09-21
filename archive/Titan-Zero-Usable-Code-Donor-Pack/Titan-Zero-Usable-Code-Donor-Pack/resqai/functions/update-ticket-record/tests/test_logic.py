import pytest
from src.handler import handle
from src.models import UpdateTicketRecordInput


def test_requires_ticket_id_and_status():
    result = handle(UpdateTicketRecordInput(ticket_id="test-uuid", status="approved_to_send"))
    assert result.status in ("success", "not_found")
    assert result.ticket_id == "test-uuid"


def test_echoes_ticket_id():
    result = handle(UpdateTicketRecordInput(ticket_id="abc-123", status="closed"))
    assert result.ticket_id == "abc-123"
