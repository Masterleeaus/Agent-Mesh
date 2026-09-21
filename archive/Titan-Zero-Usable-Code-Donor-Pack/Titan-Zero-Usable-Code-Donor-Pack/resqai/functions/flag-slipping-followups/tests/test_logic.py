from datetime import date

from src.logic import (
    classify,
    compute_slipping_followups,
    sort_slipping_followups,
    PRIORITY_wEIGHT,
)
from src.models import SlippingFollowup


class TestPriorityweight:
    def test_all_weights(self):
        assert PRIORITY_wEIGHT == {"urgent": 3, "high": 2, "normal": 1, "low": 0}


class TestClassify:
    def test_overdue_critical(self):
        assert classify(14, "normal") == ("overdue", "critical")
        assert classify(20, "low") == ("overdue", "critical")

    def test_overdue_high(self):
        assert classify(7, "normal") == ("overdue", "high")
        assert classify(10, "normal") == ("overdue", "high")
        assert classify(3, "urgent") == ("overdue", "high")
        assert classify(5, "high") == ("overdue", "high")

    def test_overdue_medium(self):
        assert classify(3, "normal") == ("overdue", "medium")
        assert classify(5, "low") == ("overdue", "medium")

    def test_overdue_low(self):
        assert classify(1, "normal") == ("overdue", "low")
        assert classify(2, "low") == ("overdue", "low")

    def test_due_today_medium(self):
        assert classify(0, "urgent") == ("due_today", "medium")
        assert classify(0, "high") == ("due_today", "medium")

    def test_due_today_low(self):
        assert classify(0, "normal") == ("due_today", "low")
        assert classify(0, "low") == ("due_today", "low")

    def test_due_soon(self):
        assert classify(-1, "urgent") == ("due_soon", "low")
        assert classify(-7, "normal") == ("due_soon", "low")


class TestSortSlippingFollowups:
    def test_overdue_before_due_today(self):
        items = [
            SlippingFollowup(followup_id="2", account_id="a", customer_id="c", customer_name="B",
                             subject="", type="", status="", priority="normal",
                             due_date="2026-06-28", days_overdue=0, severity="low",
                             bucket="due_today"),
            SlippingFollowup(followup_id="1", account_id="a", customer_id="c", customer_name="A",
                             subject="", type="", status="", priority="normal",
                             due_date="2026-06-25", days_overdue=1, severity="low",
                             bucket="overdue"),
        ]
        sorted_items = sort_slipping_followups(items)
        assert sorted_items[0].bucket == "overdue"
        assert sorted_items[1].bucket == "due_today"

    def test_critical_before_low(self):
        items = [
            SlippingFollowup(followup_id="2", account_id="a", customer_id="c", customer_name="B",
                             subject="", type="", status="", priority="normal",
                             due_date="2026-06-25", days_overdue=1, severity="low",
                             bucket="overdue"),
            SlippingFollowup(followup_id="1", account_id="a", customer_id="c", customer_name="A",
                             subject="", type="", status="", priority="normal",
                             due_date="2026-06-25", days_overdue=1, severity="critical",
                             bucket="overdue"),
        ]
        sorted_items = sort_slipping_followups(items)
        assert sorted_items[0].severity == "critical"
        assert sorted_items[1].severity == "low"

    def test_more_overdue_before_less(self):
        items = [
            SlippingFollowup(followup_id="2", account_id="a", customer_id="c", customer_name="B",
                             subject="", type="", status="", priority="normal",
                             due_date="2026-06-26", days_overdue=1, severity="high",
                             bucket="overdue"),
            SlippingFollowup(followup_id="1", account_id="a", customer_id="c", customer_name="A",
                             subject="", type="", status="", priority="normal",
                             due_date="2026-06-20", days_overdue=6, severity="high",
                             bucket="overdue"),
        ]
        sorted_items = sort_slipping_followups(items)
        assert sorted_items[0].days_overdue == 6

    def test_urgent_before_low_priority(self):
        items = [
            SlippingFollowup(followup_id="2", account_id="a", customer_id="c", customer_name="B",
                             subject="", type="", status="", priority="low",
                             due_date="2026-06-25", days_overdue=1, severity="high",
                             bucket="overdue"),
            SlippingFollowup(followup_id="1", account_id="a", customer_id="c", customer_name="A",
                             subject="", type="", status="", priority="urgent",
                             due_date="2026-06-25", days_overdue=1, severity="high",
                             bucket="overdue"),
        ]
        sorted_items = sort_slipping_followups(items)
        assert sorted_items[0].priority == "urgent"


class TestComputeSlippingFollowups:
    def test_no_followups(self):
        today = date(2026, 6, 26)
        slipping, counts, window = compute_slipping_followups(
            today=today, days_ahead=7, include_statuses=["pending", "in_progress"],
            followups_all=[], accounts_by_id={}, customers_by_id={},
        )
        assert slipping == []
        assert counts["total_scanned"] == 0
        assert counts["slipping"] == 0

    def test_filters_excluded_statuses(self):
        today = date(2026, 6, 26)
        followups_all = [
            {"id": "f1", "status": "completed", "due_date": "2026-06-20", "account_id": "a1", "customer_id": "c1"},
            {"id": "f2", "status": "pending", "due_date": "2026-06-20", "account_id": "a1", "customer_id": "c1"},
        ]
        slipping, counts, _ = compute_slipping_followups(
            today=today, days_ahead=7, include_statuses=["pending", "in_progress"],
            followups_all=followups_all, accounts_by_id={"a1": {"customer_id": "c1"}},
            customers_by_id={"c1": {"name": "Cust"}},
        )
        assert len(slipping) == 1
        assert slipping[0].followup_id == "f2"

    def test_excludes_outside_window(self):
        today = date(2026, 6, 26)
        followups_all = [
            {"id": "f1", "status": "pending", "due_date": "2026-07-15", "account_id": "a1",
             "customer_id": "c1", "subject": "test", "type": "check_in", "priority": "normal"},
        ]
        slipping, counts, _ = compute_slipping_followups(
            today=today, days_ahead=7, include_statuses=["pending", "in_progress"],
            followups_all=followups_all, accounts_by_id={"a1": {"customer_id": "c1"}},
            customers_by_id={"c1": {"name": "Cust"}},
        )
        assert len(slipping) == 0
        assert counts["excluded_outside_window"] == 1

    def test_classifies_overdue(self):
        today = date(2026, 6, 26)
        followups_all = [
            {"id": "f1", "status": "pending", "due_date": "2026-06-10", "account_id": "a1",
             "customer_id": "c1", "subject": "Call back", "type": "call", "priority": "high"},
        ]
        accounts_by_id = {"a1": {"customer_id": "c1", "name": "Acme Corp"}}
        customers_by_id = {"c1": {"name": "Acme Corp"}}
        slipping, counts, _ = compute_slipping_followups(
            today=today, days_ahead=7, include_statuses=["pending"],
            followups_all=followups_all,
            accounts_by_id=accounts_by_id,
            customers_by_id=customers_by_id,
        )
        assert len(slipping) == 1
        s = slipping[0]
        assert s.bucket == "overdue"
        assert s.days_overdue == 16
        assert s.severity == "critical"
        assert s.customer_name == "Acme Corp"

    def test_denormalizes_customer_name(self):
        today = date(2026, 6, 26)
        followups_all = [
            {"id": "f1", "status": "in_progress", "due_date": "2026-06-26", "account_id": "a1",
             "customer_id": "c1", "subject": "Review", "type": "meeting", "priority": "normal"},
        ]
        accounts_by_id = {"a1": {"customer_id": "c1"}}
        customers_by_id = {"c1": {"name": "Alice Inc."}}
        slipping, _, _ = compute_slipping_followups(
            today=today, days_ahead=7, include_statuses=["in_progress"],
            followups_all=followups_all,
            accounts_by_id=accounts_by_id,
            customers_by_id=customers_by_id,
        )
        assert slipping[0].customer_name == "Alice Inc."

    def test_fallback_customer_name(self):
        today = date(2026, 6, 26)
        followups_all = [
            {"id": "f1", "status": "pending", "due_date": "2026-06-25", "account_id": "a1",
             "customer_id": "c1", "subject": "", "type": "", "priority": "normal"},
        ]
        slipping, _, _ = compute_slipping_followups(
            today=today, days_ahead=7, include_statuses=["pending"],
            followups_all=followups_all,
            accounts_by_id={},
            customers_by_id={},
        )
        assert slipping[0].customer_name == "Unknown account"
