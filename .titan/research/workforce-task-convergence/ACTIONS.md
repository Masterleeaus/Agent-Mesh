# Actions / Handoffs

## Agent 4 — Memory / Knowledge
- Resolve `WorkItem.contextRefs` through Knowledge Authority/memory contracts.
- Do not persist memory payloads inside workforce rows.

## Agent 5 — Browser / MCP / Execution
- Map `requiredCapabilities` to canonical tool/capability contracts.
- Return evidence references/receipts to workforce completion; do not treat work assignment as tool authority.

## Agent 6 — Zero / Interaction
- Use structured workforce APIs for "what is everyone working on?", cancellation and reassignment.
- Keep UI/chat outside the workforce package.

## Agent 7 — Authority / Integration
- Audit `authorityRequirement` resolution before consequential Agent 2/5 execution.
- Confirm registration, assignment, activation, claim and delegation cannot mutate authority.
- Review whether approval completion should call `resumeWork(..., approvalSignal)` directly or via Decision Engine event adapter.

## Future integration
- Signal/business event producers may call `createWork` or `resumeWork` and then invoke dispatcher.
- Existing Titan automation scheduler should call `activateRecurring(companyId, recurringId, occurrenceKey)`; no new scheduler is introduced here.
