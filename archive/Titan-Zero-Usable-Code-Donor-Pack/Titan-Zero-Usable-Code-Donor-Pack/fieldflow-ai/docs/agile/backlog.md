# FieldFlow AI Agile Backlog

## Epic

Intelligent Equipment Service Operations

## Sprint Goal

Create an internal operations platform that detects equipment problems,
automates service workflows, and provides safe AI-assisted troubleshooting.

## Completed Stories

### FF-01: Equipment Monitoring

As a service coordinator, I want to view equipment health so that I can
identify assets requiring attention.

Acceptance criteria:

- Equipment records display in the dashboard.
- Status and health scores are visible.
- Equipment can be selected for further inspection.
- API failures display a recoverable error state.

Story points: 5  
Status: Complete

### FF-02: Live Telemetry

As a technician, I want current equipment readings so that I can investigate
operational problems.

Acceptance criteria:

- Telemetry includes temperature, pressure, RPM, voltage, and fuel.
- Readings change between requests.
- Unsafe readings produce clear alerts.
- Unknown equipment returns a 404 response.

Story points: 5  
Status: Complete

### FF-03: Persistent Service Cases

As a service coordinator, I want service cases stored in a relational database
so that work can be tracked consistently.

Acceptance criteria:

- Cases reference valid equipment.
- Cases include priority, status, source, and assignment.
- New cases persist between requests.
- Invalid equipment IDs are rejected.

Story points: 5  
Status: Complete

### FF-04: Critical Case Automation

As an operations manager, I want critical telemetry routed automatically so
that urgent issues receive attention quickly.

Acceptance criteria:

- Critical telemetry creates an assigned case.
- Existing automated cases are not duplicated.
- Healthy equipment produces no action.
- Every evaluation creates an audit event.

Story points: 8  
Status: Complete

### FF-05: AI Service Agent

As a coordinator, I want to ask natural-language questions so that I can
investigate equipment without manually searching multiple screens.

Acceptance criteria:

- The agent identifies supported message intents.
- Equipment responses use current telemetry.
- Recommendations and data sources are visible.
- Confidence is included in the response.
- Interaction history is stored.

Story points: 8  
Status: Complete

### FF-06: Human Approval

As an administrator, I want agent actions confirmed by a person so that the
agent cannot autonomously create unwanted records.

Acceptance criteria:

- The agent proposes the action first.
- The user can approve or cancel.
- No case is created before approval.
- Confirmed actions are audited.
- Duplicate AI-created cases are prevented.

Story points: 5  
Status: Complete

### FF-07: Automated Quality Checks

As a developer, I want tests and continuous integration so that regressions
are detected before changes are accepted.

Acceptance criteria:

- API behavior is covered by Pytest.
- Intent routing is tested.
- Confirmation controls are tested.
- GitHub Actions runs tests and builds the dashboard.
- Failed checks block a successful workflow result.

Story points: 5  
Status: Complete

### FF-08: Engineering Documentation

As a future maintainer, I want architecture and support documentation so that
the system can be understood and operated safely.

Acceptance criteria:

- Architecture and data relationships are documented.
- AI safeguards and limitations are documented.
- Testing strategy is documented.
- OpenAPI contract is stored with the repository.
- Local setup instructions are included.

Story points: 3  
Status: Complete

## Sprint Summary

Total completed story points: 44

## Definition of Done

A story is complete when:

- Acceptance criteria are satisfied.
- Relevant automated tests pass.
- The dashboard production build succeeds.
- Error states are handled.
- Documentation matches the implementation.
- No secrets or local database files are committed.
- GitHub Actions reports successful checks.

## Retrospective

What went well:

- Incremental development kept the API and dashboard working.
- Automated tests identified integration problems early.
- Separating agent reasoning from agent actions improved safety.
- Database audit records made workflow behavior observable.

Improvements for a future sprint:

- Add authentication and role-based access.
- Add browser-level automated testing.
- Deploy the API and dashboard to a hosted environment.
- Connect approved service manuals as a retrieval source.
- Expand and evaluate the NLP training dataset.