#input_type_name: SearchTicketsInput
#output_type_name: SearchTicketsOutput
#function_name: search_tickets

from lemma_sdk import FunctionContext, Pod

from src.models import SearchTicketsInput, SearchTicketsOutput, TicketSearchResult


async def search_tickets(ctx: FunctionContext, data: SearchTicketsInput) -> SearchTicketsOutput:
    pod = Pod.from_env()

    all_records = pod.records.list("tickets", limit=1000).to_dict().get("items", [])

    filtered = []
    for r in all_records:
        if data.status and r.get("status") != data.status:
            continue
        if data.urgency and r.get("urgency") != data.urgency:
            continue
        if data.assigned_to and r.get("assigned_to") != data.assigned_to:
            continue
        if data.channel and r.get("channel") != data.channel:
            continue
        if data.customer_name and data.customer_name.lower() not in (r.get("customer_name") or "").lower():
            continue
        filtered.append(r)

    total = len(filtered)
    page = filtered[data.offset:data.offset + data.limit]

    results = [
        TicketSearchResult(
            ticket_id=r.get("id", ""),
            customer_name=r.get("customer_name"),
            subject=r.get("subject", ""),
            status=r.get("status", ""),
            urgency=r.get("urgency", ""),
            assigned_to=r.get("assigned_to"),
            created_at=r.get("created_at", ""),
            channel=r.get("channel"),
        )
        for r in page
    ]

    return SearchTicketsOutput(
        total=total,
        results=results,
    )
