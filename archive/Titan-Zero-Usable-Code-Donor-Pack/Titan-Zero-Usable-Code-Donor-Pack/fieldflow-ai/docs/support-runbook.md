# FieldFlow AI Support Runbook

## Purpose

This runbook describes how to start, verify, troubleshoot, and safely support
the FieldFlow AI development environment.

## Services

| Service | Address |
|---|---|
| Dashboard | `http://localhost:5173` |
| API | `http://127.0.0.1:8000` |
| API health | `http://127.0.0.1:8000/health` |
| API documentation | `http://127.0.0.1:8000/docs` |

## Start the API

From the repository root:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn api.app.main:app --reload
```

Expected result:

```text
Application startup complete.
```

## Start the Dashboard

From a second terminal:

```powershell
cd dashboard
npm run dev
```

Expected result:

```text
Local: http://localhost:5173/
```

## Stop the Services

In each running terminal, press:

```text
Ctrl+C
```

## Health Verification

Open:

```text
http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "service": "fieldflow-api"
}
```

Then verify that the dashboard loads equipment, service cases, automation
activity, and the Service Agent.

## Common Problems

| Symptom | Likely cause | Resolution |
|---|---|---|
| Dashboard shows cached data | API is not running | Start Uvicorn and refresh |
| Agent says it is unavailable | Agent API cannot be reached | Check API terminal and `/health` |
| Service cases do not load | Database or API error | Review the Uvicorn error output |
| Port 8000 is unavailable | Another API process is running | Stop the existing API process |
| Port 5173 is unavailable | Another Vite process is running | Stop the existing Vite process |
| Python module not found | Virtual environment is inactive | Activate `.venv` |
| TypeScript build fails | Import or type mismatch | Read the first build error |
| GitHub Actions fails | Test or build regression | Inspect the first failed workflow step |

## Incident Response

1. Confirm whether the issue affects the API, dashboard, or both.
2. Reproduce the issue using a specific equipment ID.
3. Check the `/health` endpoint.
4. Review the API terminal output.
5. Review the browser developer console.
6. Run the automated test suite.
7. Run the production dashboard build.
8. Record the observed and expected behavior.
9. Apply the smallest safe correction.
10. Repeat the failed test and the full regression suite.

## Verification Commands

Run the API tests:

```powershell
python -m pytest api\tests -v
```

Build the dashboard:

```powershell
cd dashboard
npm run build
```

Check the repository state:

```powershell
git status
```

## Data Safety

- Local `.db` files are excluded from Git.
- Environment-variable files are excluded from Git.
- The project does not use production customer data.
- Agent case creation requires human confirmation.
- Agent and automation actions are logged.
- Database files should be backed up before manual modification.
- No credentials should be stored in source code or committed files.

## Agent Safety Verification

Verify that:

- Equipment responses include grounding sources.
- Service-case creation displays a confirmation request.
- Canceling confirmation does not create a case.
- Confirming the action creates or reuses a case.
- Repeating the request does not create duplicate AI cases.
- The interaction appears in `/api/agent/interactions`.

## Automation Verification

1. Evaluate the critical asset `FF-TR-3018`.
2. Confirm that a service case is created or reused.
3. Evaluate the same asset again.
4. Confirm that the result is `duplicate_prevented`.
5. Open `/api/automation-events`.
6. Confirm that both evaluations were recorded.

## Escalation Information

Escalate an issue when:

- Data integrity might be affected.
- The agent performs an unconfirmed action.
- Multiple automated cases are created for one condition.
- API validation can be bypassed.
- Credentials or sensitive information appear in logs.
- Automated tests fail without an understood cause.
- The application cannot recover after restarting its services.

## Recovery Checklist

After correcting an incident:

1. Restart the affected service.
2. Verify the API health endpoint.
3. Confirm that equipment data loads.
4. Confirm that service cases load.
5. Test telemetry for one healthy and one critical asset.
6. Test one Service Agent question.
7. Run all automated tests.
8. Build the production dashboard.
9. Review `git status` before committing.
10. Document the correction in the commit message.

## Support Boundaries

FieldFlow AI is a simulated portfolio application. It does not connect to
production equipment, customer systems, or manufacturer-approved service
documentation. Troubleshooting recommendations are demonstrations and must not
be treated as real equipment-maintenance instructions.