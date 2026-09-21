# Testing Strategy

## Objective

FieldFlow uses automated and manual testing to verify API behavior, workflow
safety, database integration, and dashboard build quality.

## Automated Test Coverage

The current Pytest suite contains 20 tests covering:

### Equipment API

- Health endpoint
- Complete equipment list
- Equipment lookup by ID
- Unknown-equipment handling
- Critical telemetry alert generation

### Service Cases

- Retrieve service cases
- Filter open cases
- Reject cases for unknown equipment
- Create persistent service cases

### Automation Engine

- Healthy equipment produces no action
- Critical equipment creates or reuses a case
- Duplicate automated cases are prevented
- Unknown equipment returns a clear error

### Service Agent

- Status answers use grounded equipment data
- Agent responses include confidence and sources
- Case creation requires confirmation
- Confirmed cases are created or safely reused
- Interaction history is auditable
- Example messages route to the correct intent

## Continuous Integration

GitHub Actions runs two independent jobs on pushes and pull requests:

1. Install Python dependencies and run the full API test suite.
2. Install Node dependencies and create a production dashboard build.

A failed test or TypeScript build causes the workflow to fail.

## Manual Acceptance Scenarios

| Scenario | Expected result |
|---|---|
| Open the dashboard with both servers running | Equipment and cases load |
| Select a critical asset | Critical telemetry and alerts appear |
| Evaluate critical telemetry twice | First case created, duplicate prevented |
| Ask the agent for an equipment status | Grounded response and sources appear |
| Request service-case creation | Confirmation is required |
| Confirm the action | Case is created and displayed in the queue |
| Stop the API | Dashboard displays a recoverable error state |
| Resize to mobile width | Telemetry and agent panels remain usable |

## Exit Criteria

A release candidate is ready when:

- All API tests pass.
- The dashboard production build succeeds.
- GitHub Actions shows two green jobs.
- Critical workflows pass manual acceptance testing.
- No secrets or local database files are committed.
- Architecture and support documentation match the implementation.