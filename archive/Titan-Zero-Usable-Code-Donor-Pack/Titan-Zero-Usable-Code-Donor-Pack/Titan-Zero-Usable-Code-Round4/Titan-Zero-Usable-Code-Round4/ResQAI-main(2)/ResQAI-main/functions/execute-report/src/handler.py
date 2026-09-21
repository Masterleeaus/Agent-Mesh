from datetime import datetime

from lemma_sdk import FunctionContext, Pod

from src.models import ExecuteReportInput, ExecuteReportOutput


async def execute_report(ctx: FunctionContext, data: ExecuteReportInput) -> ExecuteReportOutput:
    pod = Pod.from_env()

    report = pod.records.get("analytics_reports", data.report_id)
    if not report:
        return ExecuteReportOutput(
            status="not_found",
            report_id=data.report_id,
            data={},
            generated_at=datetime.utcnow().isoformat(),
            error=f"Report {data.report_id} not found",
        )

    config = report.get("config", {})
    params = data.params or {}
    result = {}

    tables = config.get("tables", [])
    for table_config in tables:
        table_name = table_config.get("name")
        if not table_name:
            continue
        filters = {**table_config.get("filters", {}), **params.get("filters", {})}
        limit = table_config.get("limit", 500)
        records = pod.records.list(table_name, filters, limit=limit)
        metrics = table_config.get("metrics", [])
        table_result = {}
        if metrics:
            for metric in metrics:
                metric_name = metric.get("name", "")
                metric_type = metric.get("type", "count")
                field = metric.get("field")
                if metric_type == "count":
                    table_result[metric_name] = len(records) if records else 0
                elif metric_type == "sum" and field and records:
                    table_result[metric_name] = sum(r.get(field, 0) or 0 for r in records)
                elif metric_type == "avg" and field and records:
                    values = [r.get(field, 0) or 0 for r in records]
                    table_result[metric_name] = sum(values) / len(values) if values else 0
        else:
            table_result["records"] = records or []
        result[table_name] = table_result

    now = datetime.utcnow().isoformat()

    pod.records.create("operations_log", {
        "action": "report executed",
        "result": f"report_id={data.report_id}, tables={list(result.keys())}",
        "actor": "system",
    })

    return ExecuteReportOutput(
        status="success",
        report_id=data.report_id,
        data=result,
        generated_at=now,
    )
