# Verification Map

Verification is provider-independent and occurs after provider acknowledgement.

| Business effect | Verification contract |
|---|---|
| Schedule/job change | Re-read canonical schedule/job and compare intended material fields |
| Worker assignment | Re-read canonical job/assignment state and confirm worker/company/work binding |
| Customer update | Retrieve canonical customer state and compare intended fields |
| SMS | Provider send acknowledgement produces `sent`, not VERIFIED. Correlate `company_id`, message/communication id, `conversation_id`, `correlation_id`, and provider external id; require the canonical delivery callback/receipt to reach `delivered` before delivery can be treated as verified. `failed` is terminal failure/remediation. |
| Email | SMTP/Nodemailer acceptance currently normalizes to `sent`; it is provider acknowledgement only. Do not mark business delivery VERIFIED without an independently observed delivery/bounce/provider receipt. |
| Push | Current Web Push success means the push service accepted at least one notification. Treat the normalized `sent` receipt as provider acknowledgement. Dead subscription 404/410 is negative evidence. Do not equate sendNotification success with user/device consumption. |
| Communication policy | Before provider execution, require canonical consent/opt-out, quiet-hours, channel, privacy, funding, authority and rate-limit gates. Retry/fallback must re-enter governed policy and cannot grant authority. |
| Communication idempotency | Use the company-scoped canonical communication key plus durable audit-store claim for cross-instance/recovery suppression; process-local replay guard is only a fast first line. |
| Browser action | Inspect resulting page and, where possible, canonical business state; page success text alone is not sufficient |
| MCP operation | Query/re-read resulting resource through a read capability independent of invocation acknowledgement |
| Payment/invoice follow-up preparation | Re-read prepared artefact/state; sending/charging requires separate governed consequential action |

## Communication lifecycle mapping

`queued` -> REQUESTED/PREPARED only.  
`sent` -> PROVIDER_ACKNOWLEDGED only.  
`delivered` -> eligible verification evidence when independently observed and identity-correlated.  
`failed` -> FAILED/remediation/escalation.

A provider receipt still cannot create authority. Verification failure must resolve to failure, remediation or escalation — never `VERIFIED`.
