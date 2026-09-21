# AI Governance

## Purpose

The FieldFlow Service Agent assists equipment-service teams by retrieving
operational data, explaining telemetry alerts, recommending troubleshooting
steps, and initiating service-case workflows.

It is not authorized to make destructive or safety-critical decisions.

## Safeguards

| Control | Implementation |
|---|---|
| Grounding | Responses use FieldFlow equipment records and current telemetry |
| Source transparency | Responses identify the records and telemetry used |
| Human approval | Service-case creation requires explicit confirmation |
| Least authority | The agent cannot delete or modify equipment records |
| Duplicate prevention | Existing AI-created cases are reused |
| Auditability | Messages, intent, confidence, response, and actions are logged |
| Input validation | API requests use validated Pydantic schemas |
| Limited scope | The agent only handles defined equipment-service intents |

## Supported Intents

- Equipment status and troubleshooting
- Fleet health summary
- Service-case creation
- Agent capability help

Messages are classified by a small Naive Bayes natural-language classifier.
Explicit action phrases also use deterministic routing so potentially
important requests are handled consistently.

## Human-in-the-Loop Workflow

1. The user asks the agent to create a case.
2. The agent retrieves the equipment and telemetry.
3. The agent proposes a priority and assignment.
4. The API returns `confirmation_required`.
5. The interface displays the proposed action.
6. The user approves or cancels it.
7. Only approval permits case creation.
8. The result is written to the interaction log.

## Monitoring Metrics

The platform can monitor:

- Intent classification confidence
- Tool and workflow success rate
- Confirmation acceptance rate
- Duplicate-prevention events
- Missing-equipment requests
- Agent-created service cases
- Response grounding sources
- Failed API requests

## Known Limitations

- Equipment and telemetry are simulated.
- The classifier uses a deliberately small training dataset.
- Recommendations are demonstrations, not manufacturer safety instructions.
- The agent does not replace a qualified technician.
- No production customer or personally identifiable information is used.
- Responses should be evaluated before connecting the agent to real systems.

## Future Improvements

- Expand and independently evaluate the intent dataset.
- Add role-based access control.
- Introduce approved service-manual retrieval.
- Add prompt-injection and adversarial-input tests.
- Monitor confidence drift and user feedback.
- Add escalation when confidence falls below an approved threshold.