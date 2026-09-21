# RESQAI V2 — Testing Guidelines

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Pyramid](#2-test-pyramid)
3. [Unit Tests](#3-unit-tests)
4. [Integration Tests](#4-integration-tests)
5. [Workflow Tests](#5-workflow-tests)
6. [Agent Tests](#6-agent-tests)
7. [UI Tests](#7-ui-tests)
8. [Performance Tests](#8-performance-tests)
9. [Security Tests](#9-security-tests)
10. [End-to-End Tests](#10-end-to-end-tests)
11. [Coverage Targets](#11-coverage-targets)
12. [Testing Infrastructure](#12-testing-infrastructure)

---

## 1. Testing Philosophy

### 1.1 Core Principles
- **Test behavior, not implementation** — Tests should validate what the code does, not how it does it
- **One assertion per test** — Each test validates exactly one behavior
- **Tests are code** — Tests follow same coding standards as production code
- **Fail fast** — The first test failure stops the suite; fix and retry
- **Deterministic** — No flaky tests; same input always produces same result
- **Independent** — Tests can run in any order, in parallel

### 1.2 What to Test

| Layer | What to Test | What NOT to Test |
|-------|-------------|------------------|
| Functions | Business logic, validation, error handling, event emission | Database internals, framework behavior |
| Components | Rendering, user interaction, state changes | Styling (visual regression handles this) |
| Agents | Intent classification, tool usage, escalation logic | LLM response quality (separate eval) |
| Workflows | Step sequencing, decision logic, error recovery | External service behavior (mock it) |
| Connectors | Circuit breaker, rate limiting, retry logic | Third-party API behavior |

---

## 2. Test Pyramid

```
        ╱╲
       ╱  ╲
      ╱ E2E╲           ← 3-5 critical business journeys
     ╱──────╲
    ╱Integration╲       ← Cross-component, database, connector tests
   ╱────────────╲
  ╱   Unit Tests  ╲     ← Functions, components, utils, validation
 ╱────────────────╲
╱  Static Analysis  ╲    ← Lint, type check, formatting
╱────────────────────╲
```

### 2.1 Ratio Targets
- Static analysis: 100% of files checked
- Unit tests: 80-90% of codebase
- Integration tests: 10-15% of tests
- E2E tests: 3-5% of tests (but highest confidence)

### 2.2 Test Execution Velocity
| Layer | Runtime Per Test | Run Frequency |
|-------|:---------------:|:-------------:|
| Static analysis | < 1s | Every save |
| Unit tests | < 100ms | Every save |
| Integration tests | < 5s | Every PR |
| E2E tests | < 60s | Every merge to develop |

---

## 3. Unit Tests

### 3.1 Function Unit Tests (Python)

```python
# File: v2_core_det_ticket_test.py

import pytest
from unittest.mock import Mock, patch

from v2_core_det_ticket import validate_input, format_response


class TestValidateInput:
    """Tests for validate_input function."""

    def test_valid_input_passes(self):
        """validate_input accepts valid ticket_id and org_id."""
        data = {
            "ticket_id": "550e8400-e29b-41d4-a716-446655440000",
            "org_id": "550e8400-e29b-41d4-a716-446655440001",
        }
        result = validate_input(data)
        assert result == data

    def test_missing_required_field_raises_error(self):
        """validate_input raises ValidationError when ticket_id is missing."""
        data = {"org_id": "550e8400-e29b-41d4-a716-446655440001"}
        with pytest.raises(ValidationError, match="ticket_id is required"):
            validate_input(data)

    def test_invalid_uuid_raises_error(self):
        """validate_input raises ValidationError for malformed UUID."""
        data = {
            "ticket_id": "not-a-uuid",
            "org_id": "550e8400-e29b-41d4-a716-446655440001",
        }
        with pytest.raises(ValidationError, match="ticket_id must be a valid UUID"):
            validate_input(data)


class TestFormatResponse:
    """Tests for format_response function."""

    def test_formats_success_response(self):
        """format_response returns standard success envelope."""
        data = {"ticket_id": "abc", "title": "Test"}
        result = format_response(data)
        assert result == {"success": True, "data": data}

    def test_formats_empty_data(self):
        """format_response handles empty dict."""
        result = format_response({})
        assert result == {"success": True, "data": {}}
```

### 3.2 Component Unit Tests (TypeScript/React)

```typescript
// File: TicketStatusBadge.test.tsx

import { render, screen } from '@testing-library/react';
import { TicketStatusBadge } from './TicketStatusBadge';

describe('TicketStatusBadge', () => {
  it('renders open status with correct text and color', () => {
    render(<TicketStatusBadge status="open" />);
    const badge = screen.getByText('Open');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100');
  });

  it('renders resolved status with correct text and color', () => {
    render(<TicketStatusBadge status="resolved" />);
    const badge = screen.getByText('Resolved');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renders with small size class', () => {
    render(<TicketStatusBadge status="open" size="sm" />);
    const badge = screen.getByText('Open');
    expect(badge).toHaveClass('text-xs');
  });

  it('renders with default size when not specified', () => {
    render(<TicketStatusBadge status="open" />);
    const badge = screen.getByText('Open');
    expect(badge).toHaveClass('text-sm');
  });
});
```

### 3.3 Unit Test Rules
- One test file per source file
- Test classes group related behaviors
- Test names describe expected behavior: `{scenario}_expects_{outcome}`
- No mocks for pure functions
- Mocks only at system boundaries (database, API, external services)
- No test logic (no if/for in tests)
- No shared mutable state between tests (fresh setup per test)

---

## 4. Integration Tests

### 4.1 Function Integration Tests

```python
# File: v2_core_wri_ticket_integration_test.py

import pytest
from lemma.testing import LemmaTestCase


class TestTicketWriteIntegration(LemmaTestCase):
    """Integration tests for v2_core_wri_ticket."""

    async def test_create_and_read_ticket(self):
        """Create a ticket, then verify it can be read back."""
        # Arrange
        ticket_data = {
            "title": "Integration test ticket",
            "description": "Created during integration test",
            "priority": 3,
            "customer_id": self.mock_customer["customer_id"],
        }

        # Act — Create
        create_result = await self.call_function(
            "v2_core_wri_ticket",
            ticket_data,
            auth_context=self.dispatch_auth,
        )
        assert create_result["success"] is True
        ticket_id = create_result["data"]["ticket_id"]

        # Act — Read
        read_result = await self.call_function(
            "v2_core_det_ticket",
            {"ticket_id": ticket_id},
            auth_context=self.dispatch_auth,
        )
        assert read_result["success"] is True
        assert read_result["data"]["title"] == "Integration test ticket"
```

### 4.2 Integration Test Rules
- Use test database (isolated, reset between test runs)
- Test real database queries (not mocked)
- Test auth/RLS enforcement
- Test function-to-function chains
- Test event emission
- Run against staging, not local dev

---

## 5. Workflow Tests

### 5.1 Workflow Test Template

```python
# File: v2_core_create_ticket_wf_test.py

import pytest
from lemma.testing import WorkflowTestCase


class TestCreateTicketWorkflow(WorkflowTestCase):
    """Tests for v2_core_create_ticket_wf."""

    def test_happy_path_creates_ticket_and_notifies(self):
        """Workflow creates ticket, emits event, sends notification."""
        # Arrange
        event = self.create_mock_event("v2.core.ticket.created", {
            "ticket_id": str(uuid4()),
            "title": "Test ticket",
            "customer_id": str(uuid4()),
        })

        # Act
        result = self.execute_workflow("v2_core_create_ticket_wf", event)

        # Assert
        assert result["success"] is True
        assert self.event_emitted("v2.core.ticket.assigned")
        assert self.notification_sent("email", to=self.mock_customer["email"])

    def test_invalid_event_rejected(self):
        """Workflow rejects event with missing required fields."""
        event = self.create_mock_event("v2.core.ticket.created", {
            "ticket_id": str(uuid4()),
            # Missing title
        })
        result = self.execute_workflow("v2_core_create_ticket_wf", event)
        assert result["success"] is False
        assert "title" in result["error"]

    def test_compensates_on_failure(self):
        """Workflow rolls back changes if notification step fails."""
        # Arrange
        self.mock_function("v2_notification_send_alert", side_effect=Exception("Send failed"))
        event = self.create_mock_event(...)

        # Act
        result = self.execute_workflow("v2_core_create_ticket_wf", event)

        # Assert
        assert result["success"] is False
        assert self.ticket_deleted(event["ticket_id"])  # Compensated
```

### 5.2 Required Workflow Tests
- **Happy path** — Normal execution completes all steps successfully
- **Validation error** — Invalid input is rejected at step 1
- **Function failure** — A step fails, retry mechanism engages
- **Rollback** — Compensating actions execute after failure
- **Timeout** — Workflow handles step exceeding timeout

---

## 6. Agent Tests

### 6.1 Agent Test Template

```python
# File: v2_ticket_agent_test.py

import pytest
from lemma.testing import AgentTestCase


class TestTicketAgent(AgentTestCase):
    """Tests for v2_ticket_agent."""

    def test_classifies_intent_correctly(self):
        """Agent correctly identifies ticket-related intent."""
        result = self.query_agent("v2_ticket_agent", "What's the status of ticket T-123?")
        assert result["intent"] == "ticket.status_inquiry"
        assert result["confidence"] > 0.8

    def test_routes_non_ticket_query_as_out_of_scope(self):
        """Agent routes billing queries as out of scope."""
        result = self.query_agent("v2_ticket_agent", "When was my last invoice?")
        assert result["intent"] == "out_of_scope"
        assert result["escalation"]["to"] == "v2_billing_agent"

    def test_handles_missing_ticket_id(self):
        """Agent asks for ticket ID when not provided."""
        result = self.query_agent("v2_ticket_agent", "What's the status of my ticket?")
        assert result["needs_clarification"] is True
        assert "ticket ID" in result["response"]

    def test_escalates_on_low_confidence(self):
        """Agent escalates to human when confidence is low."""
        result = self.query_agent("v2_ticket_agent",
            "This is a very unusual and complex request about a customized workflow.")
        assert result["escalation"]["reason"] == "low_confidence"
        assert result["escalation"]["to"] == "human_operator"
```

### 6.2 Agent Test Rules
- Test intent classification accuracy (10 test queries per agent)
- Test tool selection and function calls
- Test context injection behavior
- Test escalation triggers
- Test fallback behavior (degraded mode)
- Test safety guardrails (reject harmful queries)
- Mock LLM responses for deterministic tests

---

## 7. UI Tests

### 7.1 Component Tests (Vitest + Testing Library)
```typescript
// File: TicketList.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketList } from './TicketList';

describe('TicketList', () => {
  it('renders loading skeleton initially', () => {
    render(<TicketList />);
    expect(screen.getByTestId('skeleton-table')).toBeInTheDocument();
  });

  it('renders tickets after loading', async () => {
    render(<TicketList />);
    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
    });
  });

  it('filters tickets by status', async () => {
    const user = userEvent.setup();
    render(<TicketList />);

    await user.selectOptions(screen.getByLabelText('Status'), 'open');

    await waitFor(() => {
      expect(screen.getAllByTestId('ticket-row')).toHaveLength(3);
    });
  });

  it('shows empty state when no tickets match filter', async () => {
    const user = userEvent.setup();
    render(<TicketList />);

    await user.type(screen.getByPlaceholderText('Search tickets'), 'zzz_nonexistent');

    await waitFor(() => {
      expect(screen.getByText(/no tickets match/i)).toBeInTheDocument();
    });
  });
});
```

### 7.2 E2E Tests (Playwright)
```typescript
// File: create-ticket-journey.spec.ts

import { test, expect } from '@playwright/test';

test('create ticket journey: technician creates and dispatches a ticket', async ({ page }) => {
  // Login as dispatcher
  await page.goto('/v2/login');
  await page.fill('[data-testid="email"]', 'dispatcher@resqai.com');
  await page.fill('[data-testid="password"]', process.env.TEST_PASSWORD!);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL(/\/v2\/support-center/);

  // Navigate to create ticket
  await page.click('[data-testid="create-ticket-button"]');
  await expect(page).toHaveURL(/\/v2\/support-center\/tickets\/create/);

  // Fill form
  await page.fill('[data-testid="title"]', 'E2E Test Ticket');
  await page.fill('[data-testid="description"]', 'Created by Playwright E2E test');
  await page.selectOption('[data-testid="priority"]', '3');
  await page.click('[data-testid="customer-select"]');
  await page.click('[data-testid="customer-option-1"]');

  // Submit
  await page.click('[data-testid="submit-button"]');

  // Verify success toast
  await expect(page.locator('[data-testid="success-toast"]')).toContainText('Ticket created');

  // Verify ticket appears in list
  await page.goto('/v2/support-center/tickets');
  await expect(page.locator('text=E2E Test Ticket')).toBeVisible();
});
```

### 7.3 UI Test Rules
- Every component renders loading, empty, error, and success states
- Form validation tested for each field (required, format, length)
- Navigation tested for all app routes
- Keyboard accessibility tested for all interactive elements
- Responsive breakpoints tested (mobile 375px, tablet 768px, desktop 1280px)

---

## 8. Performance Tests

### 8.1 Performance Test Requirements

| Component | Tool | Metrics | Threshold |
|-----------|------|---------|:---------:|
| API functions | k6 / Locust | p50, p95, p99 latency | See BACKEND_GUIDELINES §7.1 |
| Pages | Lighthouse CI | Performance, A11y, SEO | Performance ≥ 85 |
| Workflows | Lemma perf test | Execution time per step | < 30s for non-human steps |
| Agents | Custom load test | Response latency | p95 < 5s |
| Connectors | Custom perf test | External API latency | < 1s average |

### 8.2 Load Test Scenarios

| Scenario | Users | Duration | Target |
|----------|:-----:|:--------:|--------|
| Normal load | 50 | 15 min | All components responsive |
| Peak load | 200 | 30 min | No SLA violation |
| Stress test | 500 | 5 min | Graceful degradation |
| Spike test | 0→200 in 10s | 5 min | Auto-scale handles spike |

### 8.3 Performance Test Rules
- Performance tests run against staging (not production)
- Performance results are compared against baseline (no regression)
- Performance tests run on every release candidate
- Degradation > 10% blocks release

---

## 9. Security Tests

### 9.1 Security Test Types

| Test Type | Tool | Frequency |
|-----------|------|:---------:|
| SAST (Static Analysis) | Semgrep, CodeQL | Every PR |
| DAST (Dynamic Analysis) | OWASP ZAP | Every staging deploy |
| Dependency scan | npm audit, pip-audit | Weekly |
| Secret scan | trufflehog | Every PR |
| RLS verification | Custom test script | Every migration |

### 9.2 Security Test Rules

```python
# RLS verification test
def test_rls_enforces_org_isolation():
    """User from Org A cannot access Org B's tickets."""
    # Auth as org_a user
    result_a = call_function_as("v2_core_det_ticket", {"ticket_id": ticket_in_org_b}, auth=org_a_user)
    assert result_a["success"] is False
    assert result_a["error"]["code"] == "NOT_FOUND"

    # Auth as org_b user
    result_b = call_function_as("v2_core_det_ticket", {"ticket_id": ticket_in_org_b}, auth=org_b_user)
    assert result_b["success"] is True
```

### 9.3 Security Acceptance Criteria
- [ ] Zero critical or high severity findings in dependency scan
- [ ] No secrets detected in source code
- [ ] All authenticated endpoints verify JWT
- [ ] RLS isolation verified between organizations
- [ ] Input validation rejects injection attempts
- [ ] Rate limiting functional

---

## 10. End-to-End Tests

### 10.1 Critical Business Journeys

| ID | Journey | Steps | Priority |
|:--:|---------|:-----:|:--------:|
| J1 | Ticket creation → assignment → dispatch | 7 | Critical |
| J2 | Customer portal → view ticket → add comment | 4 | Critical |
| J3 | Appointment booking → reminder → completion | 6 | Critical |
| J4 | Invoice generation → payment → receipt | 5 | High |
| J5 | Escalation → human review → resolution | 5 | High |
| J6 | Report generation → download → email | 4 | Medium |
| J7 | Admin → create user → assign role | 4 | Medium |
| J8 | Technician → view schedule → update status | 5 | Medium |

### 10.2 E2E Test Rules
- E2E tests run against full deployment (all 10 apps, all functions)
- Test data is seeded before run, cleaned up after
- E2E tests are idempotent (can run multiple times)
- E2E failures block release
- Flaky E2E tests are quarantined within 24h

---

## 11. Coverage Targets

### 11.1 Coverage by Layer

| Layer | Coverage Target | Tool |
|-------|:---------------:|------|
| Functions (Python) | 90%+ | pytest-cov |
| Frontend (TypeScript) | 80%+ | vitest --coverage |
| Agents | 85%+ | pytest-cov |
| Workflows | 85%+ | pytest-cov |
| Connectors | 90%+ | pytest-cov |
| Shared packages | 90%+ | vitest --coverage |

### 11.2 Coverage Rules
- Branch coverage measured (not just line coverage)
- Coverage below target blocks merge
- New code must maintain or improve coverage
- Coverage reports generated on every PR

---

## 12. Testing Infrastructure

### 12.1 Test Environments

| Environment | Purpose | Data | Access |
|-------------|---------|------|--------|
| Local | Development | Synthetic | Developer |
| CI | PR validation | Synthetic, ephemeral | CI runner |
| Staging | Pre-release | Anonymized copy of prod | Team |
| Production | Monitoring | Real (read-only tests) | On-call |

### 12.2 Test Fixtures

Fixtures stored in `packages/resqai-test-utils/src/`:
- `mock-ticket.ts` — Mock ticket objects
- `mock-customer.ts` — Mock customer objects
- `mock-technician.ts` — Mock technician objects
- `mock-appointment.ts` — Mock appointment objects
- `render-with-providers.tsx` — Test wrapper with all providers

### 12.3 CI Test Execution
```
On PR:
  ┌── lint (1m) ── typecheck (1m) ── unit tests (3m) ────┐
  │                                                        │
  ├── integration tests (5m) ────────────────────────────┤
  │                                                        │
  ├── security scan (2m) ────────────────────────────────┤
  │                                                        │
  └── coverage report (1m) ──────────────────────────────┘
  All must pass before merge

On merge to develop:
  ┌── E2E tests (15m) ───────────────────────────────────┐
  │                                                        │
  └── Performance tests (10m) ───────────────────────────┘
  All must pass before deploy to staging
```

---

> **End of TESTING_GUIDELINES.md**
