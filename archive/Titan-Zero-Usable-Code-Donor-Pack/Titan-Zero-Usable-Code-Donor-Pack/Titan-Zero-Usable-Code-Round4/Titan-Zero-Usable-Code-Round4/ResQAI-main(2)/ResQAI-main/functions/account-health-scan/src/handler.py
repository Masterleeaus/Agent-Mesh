import json
from datetime import date
from pathlib import Path

from .models import AccountHealthScanInput, AccountHealthScanResult
from .logic import (
    compute_account_health,
    compute_open_dispute_counts,
    sort_rows_riskiest_first,
)
from shared.fixture_loader import load_fixtures, build_id_lookup, build_group_lookup
from shared.cli import run_cli


OPEN_FOLLOwUP_STATUSES = {"pending", "in_progress", "missed"}
OPEN_DISPUTE_STATUSES = {"open", "investigating"}


def run_scan(data: AccountHealthScanInput) -> AccountHealthScanResult:
    today = data.today or date.today()
    fixture_path = Path(__file__).parent.parent

    accounts, customers, followups_all, disputes_all, appts = load_fixtures(
        fixture_path, "accounts", "customers", "followups", "disputes", "appointments"
    )

    customers_by_id = build_id_lookup(customers)

    followups = [f for f in followups_all if f.get("status") in OPEN_FOLLOwUP_STATUSES]
    followups_by_account = build_group_lookup(followups, "account_id")

    disputes = [d for d in disputes_all if d.get("status") in OPEN_DISPUTE_STATUSES]
    appts_by_customer = build_group_lookup(appts, "customer_id")

    rows = []
    by_health = {"healthy": 0, "watch": 0, "slipping": 0, "critical": 0}
    signpost_totals: dict[str, int] = {}

    for acc in accounts:
        customer = customers_by_id.get(acc["customer_id"]) or {}
        acct_followups = followups_by_account.get(acc["id"], [])

        open_dispute_count, critical_dispute_count = compute_open_dispute_counts(
            disputes, appts_by_customer, acc["customer_id"]
        )

        row = compute_account_health(
            today=today,
            lookback_days=data.lookback_days,
            relationship_overrides=data.relationship_overrides,
            acc=acc,
            customer=customer,
            acct_followups=acct_followups,
            open_dispute_count=open_dispute_count,
            critical_dispute_count=critical_dispute_count,
        )
        rows.append(row)
        by_health[row.new_health] = by_health.get(row.new_health, 0) + 1
        for s in row.signposts:
            signpost_totals[s.label] = signpost_totals.get(s.label, 0) + 1

    rows = sort_rows_riskiest_first(rows)

    totals = {
        "scanned": len(rows),
        "wrote_back": len(accounts) if data.write_back else 0,
        "signpost_totals": signpost_totals,
    }

    return AccountHealthScanResult(
        today=today.isoformat(),
        scan_params={
            "lookback_days": data.lookback_days,
            "write_back": data.write_back,
            "top_n_riskiest": data.top_n_riskiest,
        },
        totals=totals,
        by_health=by_health,
        top_risk=rows[: data.top_n_riskiest],
        all_rows=rows,
    )


def main():
    run_cli(AccountHealthScanInput, run_scan)


if __name__ == "__main__":
    main()
