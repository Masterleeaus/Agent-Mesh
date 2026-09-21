from api.app.database import SessionLocal
from api.app.database_models import EquipmentRecord, ServiceCaseRecord
from api.app.equipment_data import EQUIPMENT_RECORDS


INITIAL_SERVICE_CASES = [
    ServiceCaseRecord(
        case_id=1047,
        equipment_id="FF-TR-3018",
        title="Hydraulic pressure below threshold",
        description=(
            "Hydraulic pressure dropped below the expected operating "
            "range while the equipment was active."
        ),
        priority="critical",
        status="open",
        source="telemetry",
        assigned_to="Maya Chen",
    ),
    ServiceCaseRecord(
        case_id=1046,
        equipment_id="FF-DD-2041",
        title="Telemetry connection degraded",
        description=(
            "Equipment telemetry is arriving intermittently and may "
            "require a connectivity inspection."
        ),
        priority="high",
        status="investigating",
        source="automation",
        assigned_to="Eli Brooks",
    ),
    ServiceCaseRecord(
        case_id=1043,
        equipment_id="FF-RC-4025",
        title="Preventive maintenance approaching",
        description=(
            "The equipment is approaching its scheduled preventive "
            "maintenance interval."
        ),
        priority="medium",
        status="scheduled",
        source="manual",
        assigned_to="Jordan Lee",
    ),
]


def seed_database():
    with SessionLocal() as database:
        existing_equipment = database.query(EquipmentRecord).first()

        if existing_equipment is None:
            equipment_rows = [
                EquipmentRecord(
                    equipment_id=item.equipment_id,
                    model=item.model,
                    category=item.category,
                    serial_number=item.serial_number,
                    location=item.location,
                    assigned_dealer=item.assigned_dealer,
                    status=item.status.value,
                    engine_hours=item.engine_hours,
                    fuel_level=item.fuel_level,
                    health_score=item.health_score,
                    last_service_date=item.last_service_date,
                )
                for item in EQUIPMENT_RECORDS
            ]

            database.add_all(equipment_rows)
            database.flush()

        existing_case = database.query(ServiceCaseRecord).first()

        if existing_case is None:
            database.add_all(INITIAL_SERVICE_CASES)

        database.commit()