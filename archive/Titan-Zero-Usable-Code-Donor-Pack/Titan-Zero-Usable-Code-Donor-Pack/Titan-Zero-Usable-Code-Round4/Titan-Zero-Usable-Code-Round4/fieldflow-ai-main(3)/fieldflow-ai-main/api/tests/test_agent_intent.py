import pytest

from api.app.agent_intent import detect_intent


@pytest.mark.parametrize(
    ("message", "expected_intent"),
    [
        (
            "What is the telemetry status for FF-TR-3018?",
            "equipment_status",
        ),
        (
            "Create a service case for FF-TR-3018.",
            "create_case",
        ),
        (
            "Which machines need attention?",
            "fleet_summary",
        ),
        (
            "What can you do?",
            "help",
        ),
    ],
)
def test_agent_detects_message_intent(
    message: str,
    expected_intent: str,
):
    prediction = detect_intent(message)

    assert prediction.intent == expected_intent
    assert 0 <= prediction.confidence <= 1