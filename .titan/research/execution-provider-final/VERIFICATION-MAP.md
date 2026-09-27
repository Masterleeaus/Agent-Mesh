# Verification Map

Verification is provider-independent and occurs after provider acknowledgement.

| Business effect | Verification contract |
|---|---|
| Schedule/job change | Re-read canonical schedule/job and compare intended material fields |
| Worker assignment | Re-read canonical job/assignment state and confirm worker/company/work binding |
| Customer update | Retrieve canonical customer state and compare intended fields |
| Email/SMS/push | Inspect provider/delivery state and correlate outbound/inbound thread identifiers |
| Browser action | Inspect resulting page and, where possible, canonical business state; page success text alone is not sufficient |
| MCP operation | Query/re-read resulting resource through a read capability independent of invocation acknowledgement |
| Payment/invoice follow-up preparation | Re-read prepared artefact/state; sending/charging requires separate governed consequential action |

Verification failure must resolve to failure, remediation or escalation — never `VERIFIED`.
