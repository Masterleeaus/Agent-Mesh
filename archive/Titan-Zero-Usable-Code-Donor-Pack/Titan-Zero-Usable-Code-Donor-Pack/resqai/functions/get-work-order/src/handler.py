from src.models import GetWorkOrderInput, GetWorkOrderOutput
from lemma_sdk import FunctionContext, Pod


async def get_work_order(ctx: FunctionContext, data: GetWorkOrderInput) -> GetWorkOrderOutput:
    pod = Pod.from_env()

    work_order = pod.records.get("work_orders", data.work_order_id)
    if not work_order:
        return GetWorkOrderOutput(
            status="not_found",
            error=f"Work order {data.work_order_id} not found",
        )

    return GetWorkOrderOutput(
        status="success",
        work_order=work_order,
    )