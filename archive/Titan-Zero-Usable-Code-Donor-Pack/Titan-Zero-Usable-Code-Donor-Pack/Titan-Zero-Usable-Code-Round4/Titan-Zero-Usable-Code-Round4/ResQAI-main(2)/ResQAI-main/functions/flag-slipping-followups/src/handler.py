from datetime import date
from pathlib import Path

from .models import FlagSlippingFollowupsInput, FlagSlippingFollowupsResult
from .logic import compute_slipping_followups
from shared.fixture_loader import load_fixtures, build_id_lookup
from shared.cli import run_cli


def run_scan(data: FlagSlippingFollowupsInput) -> FlagSlippingFollowupsResult:
    today = data.today or date.today()
    fixture_path = Path(__file__).parent.parent

    followups_all, accounts, customers = load_fixtures(
        fixture_path, "followups", "accounts", "customers"
    )

    accounts_by_id = build_id_lookup(accounts)
    customers_by_id = build_id_lookup(customers)

    slipping, counts, window = compute_slipping_followups(
        today=today,
        days_ahead=data.days_ahead,
        include_statuses=data.include_statuses,
        followups_all=followups_all,
        accounts_by_id=accounts_by_id,
        customers_by_id=customers_by_id,
    )

    return FlagSlippingFollowupsResult(
        today=today.isoformat(),
        window=window,
        counts=counts,
        top=slipping[: data.top_n],
    )


def main():
    run_cli(FlagSlippingFollowupsInput, run_scan)


if __name__ == "__main__":
    main()
