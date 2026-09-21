#input_type_name: SearchCustomersInput
#output_type_name: SearchCustomersOutput
#function_name: search_customers

from lemma_sdk import FunctionContext, Pod
from src.models import SearchCustomersInput, SearchCustomersOutput, CustomerSearchResult


async def search_customers(ctx: FunctionContext, data: SearchCustomersInput) -> SearchCustomersOutput:
    pod = Pod.from_env()

    filters = {}
    if data.status:
        filters["status"] = data.status
    if data.customer_type:
        filters["customer_type"] = data.customer_type

    all_customers = pod.records.query("customers", filters)

    if data.query:
        query = data.query.lower()
        all_customers = [
            c for c in all_customers
            if query in (c.get("name") or "").lower()
        ]

    results = all_customers[:data.limit]

    return SearchCustomersOutput(
        total=len(all_customers),
        results=[
            CustomerSearchResult(
                customer_id=c.get("id"),
                name=c.get("name", ""),
                primary_email=c.get("primary_email"),
                primary_phone=c.get("primary_phone"),
                status=c.get("status"),
                customer_type=c.get("customer_type"),
                tags=c.get("tags") or [],
            )
            for c in results
        ],
    )
