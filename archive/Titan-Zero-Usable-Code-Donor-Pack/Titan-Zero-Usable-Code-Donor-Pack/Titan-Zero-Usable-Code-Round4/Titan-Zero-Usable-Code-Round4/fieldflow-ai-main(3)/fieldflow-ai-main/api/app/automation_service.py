from sqlalchemy.orm import Session

from api.app.database_models import (
    AutomationEventRecord,
    EquipmentRecord,
    ServiceCaseRecord,
)
from api.app.models import Equipment, TelemetryReading
from api.app.telemetry_service import generate_telemetry


ACTIVE_CASE_STATUSES = ("open", "in_progress")


def evaluate_equipment_automation(
    equipment: Equipment,
    database: Session,
) -> tuple[TelemetryReading, AutomationEventRecord]:
    telemetry = generate_telemetry(equipment)

    health_status = getattr(
        telemetry.health_status,
        "value",
        telemetry.health_status,
    )

    equipment_record = database.get(
        EquipmentRecord,
        equipment.equipment_id,
    )

    if equipment_record is None:
        raise ValueError(
            f"Equipment {equipment.equipment_id} is missing from the database."
        )

    service_case_id = None

    if health_status == "critical":
        existing_case = (
            database.query(ServiceCaseRecord)
            .filter(
                ServiceCaseRecord.equipment_id
                == equipment.equipment_id,
                ServiceCaseRecord.source == "automation",
                ServiceCaseRecord.status.in_(ACTIVE_CASE_STATUSES),
            )
            .order_by(ServiceCaseRecord.created_at.desc())
            .first()
        )

        if existing_case is not None:
            outcome = "duplicate_prevented"
            service_case_id = existing_case.case_id
            details = (
                "Critical telemetry was detected. "
                f"Automated case {existing_case.case_id} is already active, "
                "so another case was not created."
            )
        else:
            alert_description = " ".join(telemetry.alerts)

            service_case = ServiceCaseRecord(
                equipment_id=equipment.equipment_id,
                title="Critical telemetry condition detected",
                description=(
                    alert_description
                    or "Equipment reported a critical health condition."
                ),
                priority="critical",
                status="open",
                source="automation",
                assigned_to=equipment_record.assigned_dealer,
            )

            database.add(service_case)
            database.flush()

            service_case_id = service_case.case_id
            outcome = "service_case_created"
            details = (
                f"Service case {service_case.case_id} was created and "
                f"assigned to {equipment_record.assigned_dealer}."
            )
    else:
        outcome = "no_action"
        details = (
            "Telemetry was evaluated successfully. "
            "No critical condition was detected."
        )

    event = AutomationEventRecord(
        equipment_id=equipment.equipment_id,
        event_type="telemetry_evaluation",
        outcome=outcome,
        details=details,
        service_case_id=service_case_id,
    )

    database.add(event)
    database.commit()
    database.refresh(event)

    return telemetry, event