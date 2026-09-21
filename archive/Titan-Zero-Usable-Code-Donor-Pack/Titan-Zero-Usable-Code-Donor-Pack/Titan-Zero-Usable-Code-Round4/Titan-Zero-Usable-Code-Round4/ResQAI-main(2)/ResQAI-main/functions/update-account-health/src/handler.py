#input_type_name: UpdateAccountHealthInput
#output_type_name: UpdateAccountHealthOutput
#function_name: update_account_health

from datetime import datetime, timezone
from lemma_sdk import FunctionContext, Pod
from src.models import UpdateAccountHealthInput, UpdateAccountHealthOutput


async def update_account_health(ctx: FunctionContext, data: UpdateAccountHealthInput) -> UpdateAccountHealthOutput:
    pod = Pod.from_env()

    account = pod.records.get("accounts", data.account_id)
    if not account:
        return UpdateAccountHealthOutput(
            status="error",
            account_id=data.account_id,
            health_before="",
            health_after="",
            error=f"Account {data.account_id} not found",
        )

    health_before = account.get("health", "unknown")

    pod.records.update("accounts", data.account_id, {
        "health": data.health,
        "health_score": data.health_score,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    pod.records.create("account_health_scans", {
        "account_id": data.account_id,
        "health_before": health_before,
        "health_after": data.health,
        "health_score": data.health_score,
        "scan_notes": data.scan_notes,
        "triggered_by": data.triggered_by,
        "risk_factors": _compute_risk_factors(health_before, data.health),
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    })

    pod.records.create("operations_log", {
        "action": "update_account_health",
        "result": f"account_id={data.account_id}, health={health_before}->{data.health}, score={data.health_score}",
        "actor": data.triggered_by or "system",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return UpdateAccountHealthOutput(
        status="success",
        account_id=data.account_id,
        health_before=health_before,
        health_after=data.health,
    )


def _compute_risk_factors(health_before: str, health_after: str) -> list[str]:
    risk_factors = []
    degradation_map = {
        ("healthy", "watch"): "slight_degradation",
        ("healthy", "slipping"): "moderate_degradation",
        ("healthy", "critical"): "severe_degradation",
        ("watch", "slipping"): "moderate_degradation",
        ("watch", "critical"): "severe_degradation",
        ("slipping", "critical"): "critical_degradation",
    }
    key = (health_before, health_after)
    if key in degradation_map:
        risk_factors.append(degradation_map[key])
    if health_after in ("slipping", "critical"):
        risk_factors.append("requires_attention")
    if health_after == "critical":
        risk_factors.append("escalation_needed")
    return risk_factors
