# Approval flow

The runtime persists `WAITING_APPROVAL` with the pending tool call and decision. `resume` reuses the pending call and can pass a persisted execution wait to `authorityGateway.resume`. This is the correct base for an approval conversation.

Still needed: an authenticated Zero approval view bound to the exact company, actor, run, work, decision, capability and bounded arguments; an approval/rejection command through canonical authority; then `resume` on the same run and verification/evidence projection. Reload while waiting must rehydrate the persisted wait. A button click or provider acknowledgement cannot be displayed as a verified outcome.
