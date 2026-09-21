# ResQAI V2 — Function Tests

> Version: 2.0.0
> Generated: 2026-06-29

## Test Infrastructure

- Framework: pytest 8.0+ with pytest-asyncio
- Coverage: pytest-cov 5.0+
- Mocking: unittest.mock (patch for Pod)
- Async tests: @pytest.mark.asyncio
- Test fixtures: MagicMock-based Pod fixtures

## Test Configuration

Located in: `functions/requirements-dev.txt`
- Dependencies: pytest>=8.0, pytest-cov>=5.0, pytest-asyncio>=0.24

## Function Test Coverage

| Function | Test File | Test Count | Coverage Areas |
|----------|-----------|------------|----------------|
| accept_appointment | `functions/accept-appointment/tests/test_accept_appointment.py` | 4 | Successful acceptance, missing appointment, no technician assigned, exception handling |
| account_health_scan | `functions/account-health-scan/tests/test_logic.py` | 15 | Score classification, days-since calculation, relationship penalties, health scoring, dispute penalties, clamping, relationship overrides, sorting riskiest-first |
| analytics_aggregation | `functions/analytics-aggregation/tests/test_analytics_aggregation.py` | 2 | Metrics computation from tickets/appointments/users, empty data handling |
| assign_appointment_technician | `functions/assign-appointment-technician/tests/test_assign_appointment_technician.py` | 4 | Successful assignment, not found, manager notes in audit, exception handling |
| assign_ticket | `functions/assign-ticket/tests/test_assign_ticket.py` | 5 | Successful assignment, missing ticket, reassignment logging, assignment notes, events/operations log |
| assign_user_role | `functions/assign-user-role/tests/test_assign_user_role.py` | 3 | Successful role assignment, missing user, missing role |
| authenticate_user | `functions/authenticate-user/tests/test_authenticate_user.py` | 3 | Successful auth, user not found, auth provider mismatch |
| cancel_appointment | `functions/cancel-appointment/tests/test_cancel_appointment.py` | 3 | Successful cancellation, not found, exception handling |
| check_ticket_urgency | `functions/check-ticket-urgency/tests/test_logic.py` | 3 | Urgent/high routing, normal/low routing, ticket_id echo |
| close_ticket | `functions/close-ticket/tests/test_close_ticket.py` | 6 | Successful close, not found, already closed, notification sending, notification skip, events/log creation |
| collect_resolved_tickets | `functions/collect-resolved-tickets/tests/test_collect_resolved_tickets.py` | 5 | Closed-only filtering, empty result, lookback_days param, Discord notification, empty list handling |
| complete_appointment | `functions/complete-appointment/tests/test_complete_appointment.py` | 5 | Successful completion, not found, already completed, inventory transactions, exception handling |
| complete_followup | `functions/complete-followup/tests/test_complete_followup.py` | 5 | Successful completion, open_followups decrement, not found, already completed, operations log |
| create_appointment | `functions/create-appointment/tests/test_create_appointment.py` | 3 | Successful creation, missing customer, exception handling |
| create_customer | `functions/create-customer/tests/test_create_customer.py` | 5 | Customer + account creation, name validation, default health, operations log, optional fields |
| create_followup | `functions/create-followup/tests/test_create_followup.py` | 4 | Pending status creation, open_followups increment, account validation, operations log |
| create_followup_tasks | `functions/create-followup-tasks/tests/test_create_followup_tasks.py` | 2 | Task creation per recommendation, empty recommendations |
| create_inventory_item | `functions/create-inventory-item/tests/test_create_inventory_item.py` | 3 | Successful creation, duplicate SKU rejection, all fields |
| create_operations_tasks | `functions/create-operations-tasks/tests/test_create_operations_tasks.py` | 3 | Task creation per recommendation, team deduplication, empty recommendations |
| create_report | `functions/create-report/tests/test_create_report.py` | 2 | Successful creation, public report flag |
| create_role | `functions/create-role/tests/test_create_role.py` | 3 | Successful creation, duplicate name rejection, system role |
| create_technician | `functions/create-technician/tests/test_create_technician.py` | 3 | Successful creation, empty name validation, exception handling |
| create_ticket | `functions/create-ticket/tests/test_create_ticket.py` | 3 | Successful creation with 3 records, required field validation, DB error |
| create_user | `functions/create-user/tests/test_create_user.py` | 4 | Successful creation, invalid email rejection, duplicate email rejection, preferences passthrough |
| create_work_order | `functions/create-work-order/tests/test_create_work_order.py` | 2 | Successful creation, missing appointment |
| dashboard_metrics | `functions/dashboard-metrics/tests/test_dashboard_metrics.py` | 3 | All summaries computation, trends inclusion, empty data |
| dispatch_notification_v2 | `functions/dispatch-notification-v2/tests/test_dispatch_notification_v2.py` | 4 | In-app dispatch, email dispatch, dispatch failure, notification record creation |
| dispatch_notifications | `functions/dispatch-notifications/tests/test_dispatch_notifications.py` | 4 | All reminders dispatched, failure reporting, channel filtering, empty reminders |
| escalate_ticket | `functions/escalate-ticket/tests/test_escalate_ticket.py` | 5 | Successful escalation, missing ticket, Discord alert, Discord failure graceful, events/log creation |
| execute_report | `functions/execute-report/tests/test_execute_report.py` | 4 | Successful execution, not found, params override, generated_at timestamp |
| fetch_upcoming_appointments | `functions/fetch-upcoming-appointments/tests/test_fetch_upcoming_appointments.py` | 3 | Window filtering, status filtering, empty result |
| finalize_dispatch | `functions/finalize-dispatch/tests/test_finalize_dispatch.py` | 5 | Successful dispatch, not found, Discord alert, escalation skip, dispatch notes |
| finalize_slippage_review | `functions/finalize-slippage-review/tests/test_finalize_slippage_review.py` | 6 | Audit logging, Discord on approve, skip on not-approved, skip on no-slipping, truncation, exception handling |
| flag_slipping_followups | `functions/flag-slipping-followups/tests/test_logic.py` | 10 | Priority weights, overdue classification, due-today classification, due-soon classification, sorting (overdue first, critical first, more-overdue first, urgent first), compute slipping (empty, status filtering, window exclusion, overdue classification, customer denormalization, fallback name) |
| get_appointment | `functions/get-appointment/tests/test_get_appointment.py` | 3 | Successful retrieval, not found, exception handling |
| get_customer | `functions/get-customer/tests/test_get_customer.py` | 4 | Customer retrieval, not found, account inclusion, skip account by default |
| get_work_order | `functions/get-work-order/tests/test_get_work_order.py` | 2 | Found, not found |
| list_appointments | `functions/list-appointments/tests/test_list_appointments.py` | 5 | All listings, status filter, date range filter, limit respect, exception handling |
| list_disputes | `functions/list-disputes/tests/test_list_disputes.py` | 5 | All disputes, status filter, customer filter, ticket filter, field completeness |
| list_followups | `functions/list-followups/tests/test_list_followups.py` | 5 | All followups, account filter, status filter, assigned_to filter, due date range |
| list_inventory | `functions/list-inventory/tests/test_list_inventory.py` | 4 | All items, low stock filter, category filter, empty |
| list_permissions | `functions/list-permissions/tests/test_list_permissions.py` | 3 | All permissions, role filter, resource filter |
| list_technicians | `functions/list-technicians/tests/test_list_technicians.py` | 4 | All technicians, status filter, availability filter, exception handling |
| list_users | `functions/list-users/tests/test_list_users.py` | 4 | All users, role filter, status filter, limit respect |
| list_work_orders | `functions/list-work-orders/tests/test_list_work_orders.py` | 3 | All work orders, filter application, empty list |
| manage_permission | `functions/manage-permission/tests/test_manage_permission.py` | 3 | Grant permission, revoke permission, skip duplicate grant |
| query_audit_log | `functions/query-audit-log/tests/test_query_audit_log.py` | 5 | All entries, entity filter, action filter, pagination, correlation_id filter |
| record_audit | `functions/record-audit/tests/test_record_audit.py` | 3 | Full audit entry, minimal audit, correlation_id |
| resolve_dispute | `functions/resolve-dispute/tests/test_resolve_dispute.py` | 7 | Approve, close linked ticket, reject/reopen, unknown action, not found, Discord on approve, Discord on reject |
| resolve_dispute_v2 | `functions/resolve-dispute-v2/tests/test_resolve_dispute_v2.py` | 6 | Successful resolve, close dispute record, close linked ticket, not found, already closed, notification sending |
| schedule_report | `functions/schedule-report/tests/test_schedule_report.py` | 3 | Successful schedule, not found, next_run creation |
| search_customers | `functions/search-customers/tests/test_search_customers.py` | 5 | All customers, status filter, type filter, name substring, limit |
| search_tickets | `functions/search-tickets/tests/test_search_tickets.py` | 8 | No filters, status filter, urgency filter, assigned_to filter, customer name substring, channel filter, limit/offset, no match |
| send_bulk_notification | `functions/send-bulk-notification/tests/test_send_bulk_notification.py` | 4 | All dispatched, failures, mixed results, empty recipients |
| track_notification | `functions/track-notification/tests/test_track_notification.py` | 5 | By notification_id, by correlation_id, not found, mark as read, skip if already read |
| update_account_health | `functions/update-account-health/tests/test_update_account_health.py` | 6 | Health update, health scan record, not found, operations log, old health recording, non-degrading health |
| update_account_health_status | `functions/update-account-health-status/tests/test_update_account_health_status.py` | 6 | Audit entry, summary inclusion, Discord for critical, skip for healthy, skip for warning, recovery notes |
| update_customer | `functions/update-customer/tests/test_update_customer.py` | 4 | Field update, skip-none-fields, not found, operations log |
| update_inventory_item | `functions/update-inventory-item/tests/test_update_inventory_item.py` | 4 | Name update, transaction on quantity change, not found, no-op success |
| update_technician | `functions/update-technician/tests/test_update_technician.py` | 4 | Successful update, not found, skip when no fields, exception handling |
| update_technician_skills | `functions/update-technician-skills/tests/test_update_technician_skills.py` | 3 | Skills update, not found, exception handling |
| update_ticket_record | `functions/update-ticket-record/tests/test_logic.py` | 2 | Requires ticket_id + status, echoes ticket_id |
| update_ticket_v2 | `functions/update-ticket-v2/tests/test_update_ticket_v2.py` | 5 | Update success, not found, closed_at set, optional field skip, events + operations log |
| update_user | `functions/update-user/tests/test_update_user.py` | 3 | Field update, not found, skip when no fields |
| update_work_order | `functions/update-work-order/tests/test_update_work_order.py` | 4 | Status update, completed_at set, not found, optional fields |
| validate_session | `functions/validate-session/tests/test_validate_session.py` | 4 | Active session, session not found, session expired, session invalidated |

**Total: 69 functions with tests, 288+ test cases**

## Running Tests

```bash
# From the functions/ directory, run all tests:
cd functions
pytest

# With coverage report:
pytest --cov=. --cov-report=term-missing

# Run a specific function's tests:
pytest update-ticket-v2/tests/

# Run by marker:
pytest -m asyncio
```

## Test Patterns

Every test file follows a consistent pattern:

1. **Fixture**: Patch `src.handler.Pod` with a `MagicMock` instance
2. **Mock setup**: Configure `records.get`, `records.update`, `records.create`, `records.list`, `connectors.execute` return values
3. **Input model**: Instantiate the Pydantic input model with test data
4. **Execute**: Call the handler function with `MagicMock()` as context
5. **Assert**: Verify `result.status`, check specific fields, verify mock call args

### Common Assertions
- `result.status == "success"` / `"error"` / `"not_found"`
- `mock_pod.records.update.assert_called_once_with(...)`
- `mock_pod.records.create.assert_called_once()`
- `mock_pod.connectors.execute.assert_called_once_with("resqai-discord", "chat_post_message", ...)`

## Mocking Strategy

- **Pod**: All tests patch `src.handler.Pod` to return a `MagicMock` instance
- **records.get**: Returns a dict or `None` for not-found scenarios
- **records.create**: Returns a dict with a mock `id` field
- **records.update**: No return value (MagicMock default)
- **records.list / query**: Returns list of dicts or objects with `.to_dict()`
- **connectors.execute**: MagicMock (can raise for failure tests)
- **Side effects**: Used for sequential calls via `side_effect` with lists or lambdas

## Coverage Requirements

Minimum coverage targets per module:
- **Handler functions**: 90%+ line coverage
- **Logic/pure functions**: 95%+ line coverage
- **Models**: 100% (Pydantic models, minimal logic)

Coverage exclusions:
- `if __name__ == "__main__":` blocks
- `main()` CLI entry points (tested separately via integration tests)
