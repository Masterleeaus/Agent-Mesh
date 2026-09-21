#input_type_name: ListDisputesInput
#output_type_name: ListDisputesOutput
#function_name: list_disputes

from lemma_sdk import FunctionContext, Pod
from src.models import ListDisputesInput, ListDisputesOutput, DisputeItem


async def list_disputes(ctx: FunctionContext, data: ListDisputesInput) -> ListDisputesOutput:
    pod = Pod.from_env()

    filters = {}
    if data.status:
        filters["status"] = data.status
    if data.customer_id:
        filters["customer_id"] = data.customer_id
    if data.appointment_id:
        filters["appointment_id"] = data.appointment_id
    if data.ticket_id:
        filters["ticket_id"] = data.ticket_id

    all_disputes = pod.records.query("disputes", filters)
    results = all_disputes[:data.limit]

    return ListDisputesOutput(
        total=len(all_disputes),
        disputes=[
            DisputeItem(
                dispute_id=d.get("id"),
                customer_id=d.get("customer_id"),
                appointment_id=d.get("appointment_id"),
                ticket_id=d.get("ticket_id"),
                status=d.get("status", ""),
                customer_claim=d.get("customer_claim"),
                provider_claim=d.get("provider_claim"),
                evidence_summary=d.get("evidence_summary"),
                recommended_resolution=d.get("recommended_resolution"),
                confidence=d.get("confidence"),
                created_at=d.get("created_at"),
            )
            for d in results
        ],
    )
