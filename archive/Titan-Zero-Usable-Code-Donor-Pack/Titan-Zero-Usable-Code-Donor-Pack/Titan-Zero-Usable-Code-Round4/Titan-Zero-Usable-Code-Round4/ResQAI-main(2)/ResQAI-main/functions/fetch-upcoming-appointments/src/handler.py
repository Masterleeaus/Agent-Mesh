#input_type_name: FetchUpcomingAppointmentsInput
#output_type_name: FetchUpcomingAppointmentsOutput
#function_name: fetch_upcoming_appointments

from datetime import date, datetime, timedelta
from typing import Optional

from pydantic import BaseModel, Field
from lemma_sdk import FunctionContext, Pod


class Appointment(BaseModel):
    appointment_id: str
    customer_id: str
    customer_name: str
    technician: Optional[str] = None
    status: str
    scheduled_date: str
    scheduled_time: Optional[str] = None
    service_type: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None


class FetchUpcomingAppointmentsInput(BaseModel):
    today: Optional[date] = Field(default=None, description="Override date for testing. Defaults to system date.")
    days_ahead: int = Field(default=2, description="How many days ahead to look for appointments.")
    statuses: list[str] = Field(default_factory=lambda: ["confirmed", "scheduled"], description="Appointment statuses to include.")


class FetchUpcomingAppointmentsOutput(BaseModel):
    today: str
    count: int
    appointments: list[Appointment]


async def fetch_upcoming_appointments(ctx: FunctionContext, data: FetchUpcomingAppointmentsInput) -> FetchUpcomingAppointmentsOutput:
    pod = Pod.from_env()
    ref_date = data.today or date.today()
    horizon = ref_date + timedelta(days=data.days_ahead)

    cutoff_start = ref_date.isoformat()
    cutoff_end = horizon.isoformat()

    all_records = pod.records.list("appointments", limit=200).to_dict()["items"]

    upcoming: list[Appointment] = []
    for r in all_records:
        if r.get("status") not in data.statuses:
            continue
        sched = r.get("scheduled_date", "")
        if sched and cutoff_start <= sched <= cutoff_end:
            upcoming.append(Appointment(
                appointment_id=r["id"],
                customer_id=r.get("customer_id", ""),
                customer_name=r.get("customer_name", ""),
                technician=r.get("technician"),
                status=r.get("status", ""),
                scheduled_date=sched,
                scheduled_time=r.get("scheduled_time"),
                service_type=r.get("service_type"),
                notes=r.get("notes"),
                location=r.get("location"),
            ))

    return FetchUpcomingAppointmentsOutput(
        today=ref_date.isoformat(),
        count=len(upcoming),
        appointments=upcoming,
    )
