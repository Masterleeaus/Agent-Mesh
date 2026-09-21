import re

from sqlalchemy.orm import Session

from api.app.agent_intent import detect_intent
from api.app.agent_schemas import AgentChatRequest, AgentChatResponse
from api.app.database_models import (
    AgentInteractionRecord,
    EquipmentRecord,
    ServiceCaseRecord,
)
from api.app.equipment_data import EQUIPMENT_RECORDS
from api.app.models import Equipment, TelemetryReading
from api.app.telemetry_service import generate_telemetry


EQUIPMENT_ID_PATTERN = re.compile(r"\bFF-[A-Z]{2}-\d{4}\b")
ACTIVE_CASE_STATUSES = ("open", "in_progress")


def extract_equipment_id(message: str) -> str | None:
    match = EQUIPMENT_ID_PATTERN.search(message.upper())

    if match is None:
        return None

    return match.group(0)


def find_equipment(equipment_id: str) -> Equipment | None:
    return next(
        (
            equipment
            for equipment in EQUIPMENT_RECORDS
            if equipment.equipment_id == equipment_id
        ),
        None,
    )


def get_status_value(equipment: Equipment) -> str:
    return str(
        getattr(equipment.status, "value", equipment.status)
    )


def recommend_actions(
    telemetry: TelemetryReading,
) -> list[str]:
    actions: list[str] = []

    for alert in telemetry.alerts:
        lowered_alert = alert.lower()

        if "temperature" in lowered_alert:
            actions.append(
                "Inspect the cooling system and verify coolant levels."
            )
        elif "hydraulic pressure" in lowered_alert:
            actions.append(
                "Inspect hydraulic fluid, filters, and pressure sensors."
            )
        elif "battery voltage" in lowered_alert:
            actions.append(
                "Test the battery and charging-system connections."
            )
        elif "degraded" in lowered_alert:
            actions.append(
                "Check the telemetry gateway and network connection."
            )
        elif "offline" in lowered_alert:
            actions.append(
                "Confirm power and connectivity at the equipment."
            )
        elif "maintenance" in lowered_alert:
            actions.append(
                "Review the active maintenance work order."
            )

    if not actions:
        actions.append(
            "Continue normal operation and monitor future telemetry."
        )

    return actions


def save_interaction(
    database: Session,
    request: AgentChatRequest,
    reply: str,
    intent: str,
    confidence: float,
    equipment_id: str | None,
    requires_confirmation: bool,
    action_status: str,
    service_case_id: int | None,
    recommended_actions: list[str],
    sources: list[str],
) -> AgentChatResponse:
    interaction = AgentInteractionRecord(
        equipment_id=equipment_id,
        user_message=request.message,
        detected_intent=intent,
        confidence=confidence,
        agent_response=reply,
        action_status=action_status,
        service_case_id=service_case_id,
    )

    database.add(interaction)
    database.commit()
    database.refresh(interaction)

    return AgentChatResponse(
        interaction_id=interaction.interaction_id,
        reply=reply,
        intent=intent,
        confidence=confidence,
        equipment_id=equipment_id,
        requires_confirmation=requires_confirmation,
        action_status=action_status,
        service_case_id=service_case_id,
        recommended_actions=recommended_actions,
        sources=sources,
        created_at=interaction.created_at,
    )


def handle_agent_chat(
    request: AgentChatRequest,
    database: Session,
) -> AgentChatResponse:
    prediction = detect_intent(request.message)
    equipment_id = extract_equipment_id(request.message)

    if prediction.intent == "help":
        return save_interaction(
            database=database,
            request=request,
            reply=(
                "I can inspect equipment telemetry, summarize fleet "
                "health, recommend troubleshooting actions, and create "
                "service cases after receiving your confirmation."
            ),
            intent=prediction.intent,
            confidence=prediction.confidence,
            equipment_id=None,
            requires_confirmation=False,
            action_status="not_requested",
            service_case_id=None,
            recommended_actions=[],
            sources=["FieldFlow Service Agent capability registry"],
        )

    if prediction.intent == "fleet_summary":
        attention_items = [
            equipment
            for equipment in EQUIPMENT_RECORDS
            if get_status_value(equipment) != "operational"
        ]

        summary = "; ".join(
            (
                f"{equipment.equipment_id} is "
                f"{get_status_value(equipment)}"
            )
            for equipment in attention_items
        )

        return save_interaction(
            database=database,
            request=request,
            reply=(
                f"{len(attention_items)} assets currently require "
                f"attention: {summary}."
            ),
            intent=prediction.intent,
            confidence=prediction.confidence,
            equipment_id=None,
            requires_confirmation=False,
            action_status="not_requested",
            service_case_id=None,
            recommended_actions=[
                "Review critical equipment before warning-level assets."
            ],
            sources=["FieldFlow equipment registry"],
        )

    if equipment_id is None:
        return save_interaction(
            database=database,
            request=request,
            reply=(
                "Please include an equipment ID such as "
                "FF-TR-3018 so I can inspect the correct asset."
            ),
            intent=prediction.intent,
            confidence=prediction.confidence,
            equipment_id=None,
            requires_confirmation=False,
            action_status="missing_equipment_id",
            service_case_id=None,
            recommended_actions=[],
            sources=[],
        )

    equipment = find_equipment(equipment_id)

    if equipment is None:
        return save_interaction(
            database=database,
            request=request,
            reply=(
                f"I could not find equipment {equipment_id} "
                "in the FieldFlow registry."
            ),
            intent=prediction.intent,
            confidence=prediction.confidence,
            equipment_id=None,
            requires_confirmation=False,
            action_status="equipment_not_found",
            service_case_id=None,
            recommended_actions=[],
            sources=["FieldFlow equipment registry"],
        )

    telemetry = generate_telemetry(equipment)
    status_value = get_status_value(equipment)
    actions = recommend_actions(telemetry)
    sources = [
        f"Equipment record: {equipment_id}",
        f"Live telemetry: {telemetry.recorded_at.isoformat()}",
    ]

    if prediction.intent == "equipment_status":
        alert_summary = (
            " ".join(telemetry.alerts)
            if telemetry.alerts
            else "No active telemetry alerts were detected."
        )

        reply = (
            f"{equipment_id} is currently {status_value}. "
            f"Engine temperature is "
            f"{telemetry.engine_temperature_c}°C, hydraulic pressure "
            f"is {telemetry.hydraulic_pressure_psi} PSI, and battery "
            f"voltage is {telemetry.battery_voltage}V. "
            f"{alert_summary}"
        )

        return save_interaction(
            database=database,
            request=request,
            reply=reply,
            intent=prediction.intent,
            confidence=prediction.confidence,
            equipment_id=equipment_id,
            requires_confirmation=False,
            action_status="not_requested",
            service_case_id=None,
            recommended_actions=actions,
            sources=sources,
        )

    equipment_record = database.get(
        EquipmentRecord,
        equipment_id,
    )

    if equipment_record is None:
        raise ValueError(
            f"Equipment {equipment_id} is missing from the database."
        )

    if not request.confirm_action:
        priority = (
            "critical"
            if status_value == "critical"
            else "high"
        )

        reply = (
            f"I can create a {priority}-priority service case for "
            f"{equipment_id} and route it to "
            f"{equipment_record.assigned_dealer}. "
            "This action requires your confirmation."
        )

        return save_interaction(
            database=database,
            request=request,
            reply=reply,
            intent="create_case",
            confidence=prediction.confidence,
            equipment_id=equipment_id,
            requires_confirmation=True,
            action_status="confirmation_required",
            service_case_id=None,
            recommended_actions=actions,
            sources=sources,
        )

    existing_case = (
        database.query(ServiceCaseRecord)
        .filter(
            ServiceCaseRecord.equipment_id == equipment_id,
            ServiceCaseRecord.source == "ai_agent",
            ServiceCaseRecord.status.in_(ACTIVE_CASE_STATUSES),
        )
        .order_by(ServiceCaseRecord.created_at.desc())
        .first()
    )

    if existing_case is not None:
        reply = (
            f"Service case {existing_case.case_id} is already active "
            f"for {equipment_id}, so I did not create a duplicate."
        )

        return save_interaction(
            database=database,
            request=request,
            reply=reply,
            intent="create_case",
            confidence=prediction.confidence,
            equipment_id=equipment_id,
            requires_confirmation=False,
            action_status="duplicate_prevented",
            service_case_id=existing_case.case_id,
            recommended_actions=actions,
            sources=sources,
        )

    priority = (
        "critical"
        if status_value == "critical"
        else "high"
    )

    service_case = ServiceCaseRecord(
        equipment_id=equipment_id,
        title=f"AI-assisted service request: {equipment.model}",
        description=(
            f"Created through the FieldFlow Service Agent. "
            f"Original request: {request.message} "
            f"Telemetry alerts: {' '.join(telemetry.alerts)}"
        ),
        priority=priority,
        status="open",
        source="ai_agent",
        assigned_to=equipment_record.assigned_dealer,
    )

    database.add(service_case)
    database.flush()

    reply = (
        f"Service case {service_case.case_id} was created and assigned "
        f"to {equipment_record.assigned_dealer}."
    )

    return save_interaction(
        database=database,
        request=request,
        reply=reply,
        intent="create_case",
        confidence=prediction.confidence,
        equipment_id=equipment_id,
        requires_confirmation=False,
        action_status="service_case_created",
        service_case_id=service_case.case_id,
        recommended_actions=actions,
        sources=sources,
    )