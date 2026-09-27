# Titan Hub Full-Suite Upgrade — alpha.8

This pass deepens Hub's customer workspace wiring against the installed eight-suite without taking ownership from domain providers.

## Changes

- Provider-backed capability discovery determines whether Home, Book, Inbox and More are presently serviceable.
- Hub client navigation disables unavailable workspaces while remaining fail-closed if discovery itself is unavailable.
- Home projection now includes jobs, bookings, quotes and invoices.
- Nested home summary payloads are normalized into safe scalar presentation copy.
- Book only emits its governed request-service intent when exactly one provider supplies the underlying action.

## Boundary

`company_id` remains the only canonical company boundary. Capability discovery exposes registration presence only; it does not grant authorization and does not replace provider-side checks.
