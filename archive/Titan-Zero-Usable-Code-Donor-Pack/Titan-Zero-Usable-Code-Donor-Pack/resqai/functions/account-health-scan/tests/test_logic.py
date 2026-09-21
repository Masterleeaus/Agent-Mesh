from datetime import date

from src.logic import (
    classify_score,
    compute_account_health,
    compute_open_dispute_counts,
    sort_rows_riskiest_first,
    _parse_date,
    _days_since,
    RELATIONSHIP_PENALTY,
)
from src.models import AccountHealthRow


class TestParseDate:
    def test_iso_string(self):
        assert _parse_date("2026-06-25") == date(2026, 6, 25)

    def test_iso_datetime_string(self):
        assert _parse_date("2026-06-25T10:30:00Z") == date(2026, 6, 25)

    def test_date_object(self):
        d = date(2026, 6, 25)
        assert _parse_date(d) == d

    def test_raises_on_invalid(self):
        import pytest
        with pytest.raises(ValueError):
            _parse_date(12345)


class TestDaysSince:
    def test_none_raw(self):
        assert _days_since(date(2026, 6, 26), None) is None

    def test_empty_raw(self):
        assert _days_since(date(2026, 6, 26), "") is None

    def test_positive_days(self):
        assert _days_since(date(2026, 6, 26), "2026-06-01") == 25

    def test_zero_days(self):
        assert _days_since(date(2026, 6, 26), "2026-06-26") == 0


class TestClassifyScore:
    def test_healthy(self):
        assert classify_score(0.80) == "healthy"
        assert classify_score(1.0) == "healthy"
        assert classify_score(0.85) == "healthy"

    def test_watch(self):
        assert classify_score(0.60) == "watch"
        assert classify_score(0.75) == "watch"
        assert classify_score(0.79) == "watch"

    def test_slipping(self):
        assert classify_score(0.35) == "slipping"
        assert classify_score(0.50) == "slipping"
        assert classify_score(0.59) == "slipping"

    def test_critical(self):
        assert classify_score(0.0) == "critical"
        assert classify_score(0.20) == "critical"
        assert classify_score(0.34) == "critical"


class TestRelationshipPenalty:
    def test_known_statuses(self):
        assert RELATIONSHIP_PENALTY["new"] == 0.0
        assert RELATIONSHIP_PENALTY["active"] == 0.0
        assert RELATIONSHIP_PENALTY["watch"] == 0.05
        assert RELATIONSHIP_PENALTY["at_risk"] == 0.25
        assert RELATIONSHIP_PENALTY["in_dispute"] == 0.35
        assert RELATIONSHIP_PENALTY["dormant"] == 0.30
        assert RELATIONSHIP_PENALTY["won_back"] == 0.05
        assert RELATIONSHIP_PENALTY["churned"] == 0.40


class TestComputeAccountHealth:
    def test_healthy_account(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test Account",
            "health": "healthy",
            "health_score": 0.95,
            "relationship_status": "active",
            "last_contact_date": "2026-06-20",
            "last_service_date": "2026-06-15",
            "lifetime_jobs": 10,
        }
        customer = {"name": "Test Customer"}
        row = compute_account_health(
            today=today,
            lookback_days=120,
            relationship_overrides={},
            acc=acc,
            customer=customer,
            acct_followups=[],
            open_dispute_count=0,
            critical_dispute_count=0,
        )
        assert row.new_health == "healthy"
        assert row.new_score >= 0.80
        assert row.signposts == []

    def test_no_contact_penalty(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test",
            "relationship_status": "active",
            "last_contact_date": "2025-06-01",
            "lifetime_jobs": 5,
        }
        row = compute_account_health(
            today=today, lookback_days=120, relationship_overrides={},
            acc=acc, customer={}, acct_followups=[],
            open_dispute_count=0, critical_dispute_count=0,
        )
        assert any(s.label == "no_contact" for s in row.signposts)
        assert row.new_score < 1.0

    def test_no_service_penalty(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test",
            "relationship_status": "active",
            "last_contact_date": "2026-06-20",
            "lifetime_jobs": 0,
        }
        row = compute_account_health(
            today=today, lookback_days=120, relationship_overrides={},
            acc=acc, customer={}, acct_followups=[],
            open_dispute_count=0, critical_dispute_count=0,
        )
        assert any(s.label == "no_service" for s in row.signposts)

    def test_open_dispute_penalty(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test",
            "relationship_status": "active",
            "last_contact_date": "2026-06-20",
            "last_service_date": "2026-06-15",
            "lifetime_jobs": 10,
        }
        row = compute_account_health(
            today=today, lookback_days=120, relationship_overrides={},
            acc=acc, customer={}, acct_followups=[],
            open_dispute_count=1, critical_dispute_count=0,
        )
        assert any(s.label == "open_dispute" for s in row.signposts)

    def test_critical_dispute_penalty(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test",
            "relationship_status": "active",
            "last_contact_date": "2026-06-20",
            "last_service_date": "2026-06-15",
            "lifetime_jobs": 10,
        }
        row = compute_account_health(
            today=today, lookback_days=120, relationship_overrides={},
            acc=acc, customer={}, acct_followups=[],
            open_dispute_count=1, critical_dispute_count=1,
        )
        labels = {s.label for s in row.signposts}
        assert "open_dispute" in labels
        assert "critical_dispute" in labels

    def test_score_clamped(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test",
            "relationship_status": "churned",
            "last_contact_date": "2020-01-01",
            "lifetime_jobs": 0,
        }
        row = compute_account_health(
            today=today, lookback_days=30, relationship_overrides={},
            acc=acc, customer={}, acct_followups=[],
            open_dispute_count=5, critical_dispute_count=2,
        )
        assert 0.0 <= row.new_score <= 1.0

    def test_relationship_override(self):
        today = date(2026, 6, 26)
        acc = {
            "id": "acc-1",
            "customer_id": "cust-1",
            "name": "Test",
            "relationship_status": "active",
            "last_contact_date": "2026-06-20",
            "last_service_date": "2026-06-15",
            "lifetime_jobs": 10,
        }
        row = compute_account_health(
            today=today, lookback_days=120,
            relationship_overrides={"acc-1": "churned"},
            acc=acc, customer={}, acct_followups=[],
            open_dispute_count=0, critical_dispute_count=0,
        )
        assert row.relationship_status == "churned"


class TestComputeOpenDisputeCounts:
    def test_no_disputes(self):
        count, critical = compute_open_dispute_counts([], {}, "cust-1")
        assert count == 0
        assert critical == 0

    def test_with_disputes(self):
        disputes = [
            {"appointment_id": "apt-1", "status": "open"},
            {"appointment_id": "apt-1", "status": "investigating", "recommended_resolution": "refund"},
        ]
        appts_by_customer = {"cust-1": [{"id": "apt-1"}]}
        count, critical = compute_open_dispute_counts(disputes, appts_by_customer, "cust-1")
        assert count == 2
        assert critical == 1


class TestSortRowsRiskiestFirst:
    def test_sort_order(self):
        rows = [
            AccountHealthRow(account_id="a", customer_id="c", name="A", relationship_status="active",
                             prior_health="healthy", new_health="slipping", new_score=0.5,
                             score_delta=-0.3, open_followups=2, overdue_followups=1,
                             open_disputes=0, signposts=[], summary=""),
            AccountHealthRow(account_id="b", customer_id="c", name="B", relationship_status="active",
                             prior_health="healthy", new_health="critical", new_score=0.2,
                             score_delta=-0.6, open_followups=5, overdue_followups=3,
                             open_disputes=2, signposts=[], summary=""),
        ]
        sorted_rows = sort_rows_riskiest_first(rows)
        assert sorted_rows[0].account_id == "b"
        assert sorted_rows[1].account_id == "a"
