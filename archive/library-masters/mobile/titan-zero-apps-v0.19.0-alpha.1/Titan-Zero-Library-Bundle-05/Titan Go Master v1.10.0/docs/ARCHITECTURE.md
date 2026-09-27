# Titan Apps: Go — Architecture

Go is the canonical `go` worker/field application surface. It owns worker UX, navigation, presentation state and device-local offline envelopes. It does **not** own CRM, job, scheduling, dispatch, evidence or field business truth. Those remain provider/domain responsibilities, principally Titan Field.

All mutations are governed action intents. All reads are worker-safe Go projections. Interface Runtime determines semantic UI structure, Visual Runtime executes presentation, Interaction Engine handles interaction intent/context, and Builder supplies governed component vocabulary.
