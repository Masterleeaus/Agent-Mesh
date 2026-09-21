#input_type_name: GetCustomerInput
#output_type_name: GetCustomerOutput
#function_name: get_customer

from lemma_sdk import FunctionContext, Pod
from src.models import GetCustomerInput, GetCustomerOutput


async def get_customer(ctx: FunctionContext, data: GetCustomerInput) -> GetCustomerOutput:
    pod = Pod.from_env()

    customer = pod.records.get("customers", data.customer_id)
    if not customer:
        return GetCustomerOutput(
            status="error",
            error=f"Customer {data.customer_id} not found",
        )

    account = None
    if data.include_account:
        accounts = pod.records.query("accounts", {"customer_id": data.customer_id})
        if accounts:
            account = accounts[0]

    return GetCustomerOutput(
        status="success",
        customer=customer,
        account=account,
    )
