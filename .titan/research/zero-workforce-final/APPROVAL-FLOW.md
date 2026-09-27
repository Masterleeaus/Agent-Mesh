# Approval Flow

## Existing runtime behavior verified

```text
model requests consequential capability
→ capability resolves
→ authorityGateway.authorize(...)
→ approval_required
→ approval.required event
→ WAITING_APPROVAL
→ persist pending tool_call + decision in run.wait
→ user decision arrives through Zero
→ resume same company_id + run_id
→ re-authorize/resume pending execution
→ authorityGateway.execute/resume
→ verification required
→ evidence reference captured
→ runtime continues/completes
→ Zero projects verified result
```

## Safety properties
- Approval does not grant blanket authority; it is bounded to the pending operation/decision.
- Memory/preferences cannot approve an action.
- Cross-company resume returns not-found.
- Terminal runs cannot be resumed.
- Pending execution can resume through the gateway without replaying the provider action.
- Provider success without verified outcome fails closed.

## Remaining UI/integration checks
- Zero approval message/control must carry the existing decision/run/work correlation, not create a replacement operation.
- Reject must terminate/return the pending action cleanly through existing authority semantics.
- Restart while waiting must recover the same operation from the persistent run store.
- Approval presentation must describe the bounded action and material consequence without exposing hidden reasoning.