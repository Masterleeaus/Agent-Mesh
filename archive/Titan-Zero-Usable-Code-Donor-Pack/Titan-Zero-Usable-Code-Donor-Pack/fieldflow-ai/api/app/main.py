from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi import status as http_status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from api.app.agent_schemas import (
    AgentChatRequest,
    AgentChatResponse,
    AgentInteractionResponse,
)
from api.app.agent_service import handle_agent_chat
from api.app.automation_schemas import (
    AutomationEvaluationResponse,
    AutomationEventResponse,
)
from api.app.automation_service import evaluate_equipment_automation
from api.app.database import create_database, get_database_session
from api.app.database_models import (
    AgentInteractionRecord,
    AutomationEventRecord,
    EquipmentRecord,
    ServiceCaseRecord,
)
from api.app.database_seed import seed_database
from api.app.equipment_data import EQUIPMENT_RECORDS
from api.app.models import Equipment, TelemetryReading
from api.app.service_case_schemas import (
    ServiceCaseCreate,
    ServiceCaseResponse,
    ServiceCaseStatus,
)
from api.app.telemetry_service import generate_telemetry


@asynccontextmanager
async def lifespan(application: FastAPI):
    del application

    create_database()
    seed_database()
    yield


app = FastAPI(
    title="FieldFlow Equipment API",
    description=(
        "Equipment telemetry, intelligent automation, and "
        "AI-assisted service operations API for FieldFlow AI."
    ),
    version="1.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)


def find_equipment(equipment_id: str) -> Equipment:
    for equipment in EQUIPMENT_RECORDS:
        if equipment.equipment_id == equipment_id:
            return equipment

    raise HTTPException(
        status_code=404,
        detail=f"Equipment {equipment_id} was not found.",
    )


@app.get("/")
def get_api_information():
    return {
        "name": "FieldFlow Equipment API",
        "version": "1.2.0",
        "status": "operational",
        "documentation": "/docs",
    }


@app.get("/health")
def get_health_status():
    return {
        "status": "healthy",
        "service": "fieldflow-api",
    }


@app.get(
    "/api/equipment",
    response_model=list[Equipment],
)
def get_all_equipment():
    return EQUIPMENT_RECORDS


@app.get(
    "/api/equipment/{equipment_id}",
    response_model=Equipment,
)
def get_equipment(equipment_id: str):
    return find_equipment(equipment_id)


@app.get(
    "/api/equipment/{equipment_id}/telemetry",
    response_model=TelemetryReading,
)
def get_equipment_telemetry(equipment_id: str):
    equipment = find_equipment(equipment_id)
    return generate_telemetry(equipment)


@app.get(
    "/api/service-cases",
    response_model=list[ServiceCaseResponse],
)
def get_service_cases(
    case_status: ServiceCaseStatus | None = None,
    database: Session = Depends(get_database_session),
):
    query = database.query(ServiceCaseRecord)

    if case_status is not None:
        query = query.filter(
            ServiceCaseRecord.status == case_status.value
        )

    return query.order_by(
        ServiceCaseRecord.created_at.desc()
    ).all()


@app.post(
    "/api/service-cases",
    response_model=ServiceCaseResponse,
    status_code=http_status.HTTP_201_CREATED,
)
def create_service_case(
    case_data: ServiceCaseCreate,
    database: Session = Depends(get_database_session),
):
    equipment = database.get(
        EquipmentRecord,
        case_data.equipment_id,
    )

    if equipment is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Equipment {case_data.equipment_id} "
                "was not found."
            ),
        )

    service_case = ServiceCaseRecord(
        equipment_id=case_data.equipment_id,
        title=case_data.title,
        description=case_data.description,
        priority=case_data.priority.value,
        status=ServiceCaseStatus.OPEN.value,
        source=case_data.source.value,
        assigned_to=case_data.assigned_to,
    )

    database.add(service_case)
    database.commit()
    database.refresh(service_case)

    return service_case


@app.post(
    "/api/automations/evaluate/{equipment_id}",
    response_model=AutomationEvaluationResponse,
)
def evaluate_automation(
    equipment_id: str,
    database: Session = Depends(get_database_session),
):
    equipment = find_equipment(equipment_id)

    telemetry, event = evaluate_equipment_automation(
        equipment,
        database,
    )

    return AutomationEvaluationResponse(
        equipment_id=equipment_id,
        outcome=event.outcome,
        message=event.details,
        service_case_id=event.service_case_id,
        event_id=event.event_id,
        evaluated_at=event.created_at,
        telemetry=telemetry,
    )


@app.get(
    "/api/automation-events",
    response_model=list[AutomationEventResponse],
)
def get_automation_events(
    database: Session = Depends(get_database_session),
):
    return (
        database.query(AutomationEventRecord)
        .order_by(AutomationEventRecord.created_at.desc())
        .limit(50)
        .all()
    )


@app.post(
    "/api/agent/chat",
    response_model=AgentChatResponse,
)
def chat_with_service_agent(
    request: AgentChatRequest,
    database: Session = Depends(get_database_session),
):
    return handle_agent_chat(request, database)


@app.get(
    "/api/agent/interactions",
    response_model=list[AgentInteractionResponse],
)
def get_agent_interactions(
    database: Session = Depends(get_database_session),
):
    return (
        database.query(AgentInteractionRecord)
        .order_by(AgentInteractionRecord.created_at.desc())
        .limit(50)
        .all()
    )