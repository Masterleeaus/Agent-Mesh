# Connector Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Connector Inventory

Based on `CONNECTOR_INTEGRATION_REPORT.md` and source code analysis:

| # | Connector | Type | Used By Agents | Used By Functions | Used By Apps | Status |
|---|-----------|------|---------------|-------------------|-------------|--------|
| 1 | Discord | Chat/Messaging | account-health-monitor, operations-coordinator, support-reply-drafter | collect_resolved_tickets, finalize_slippage_review, finalize_dispatch | crm-tracker | ✅ Integrated |
| 2 | Gmail | Email | support-reply-drafter | — | — | ⚠️ Partially integrated (outbound not ready) |
| 3 | Facebook | Social | request-classifier | — | — | ⚠️ Partially integrated (inbound not ready) |
| 4 | Instagram | Social | request-classifier | — | — | ⚠️ Partially integrated (inbound not ready) |
| 5 | Reddit | Social | support-reply-drafter | — | — | ✅ Integrated (read-only) |

---

## Connector → Agent Mapping

| Agent | Connectors | Purpose |
|-------|-----------|---------|
| account-health-monitor | Discord | Critical account alerts, slipping acceleration notifications |
| operations-coordinator | Discord | Crisis alerts, urgent ticket notifications, daily standup summaries |
| request-classifier | Facebook, Instagram | Read customer messages from social media |
| support-reply-drafter | Gmail, Discord, Reddit | Send emails, post to Discord, monitor Reddit |

---

## Connector → Function Mapping

| Function | Connector | Purpose |
|----------|-----------|---------|
| collect_resolved_tickets | Discord | Post daily satisfaction monitor summary to #support-reviews |
| finalize_slippage_review | Discord | Post followup slippage alerts to #support-alerts |
| finalize_dispatch | Discord | Post urgent dispatch notifications to #support-alerts |

---

## Connector → Workflow Mapping

| Workflow | Connector | Purpose |
|----------|-----------|---------|
| customer-satisfaction-monitor | Discord | Notification via collect_resolved_tickets function |
| followup-slippage-detector | Discord | Alert via finalize_slippage_review function |
| urgent-dispatch | Discord | Alert via finalize_dispatch function |

---

## Connector → App Mapping

| App | Connectors | Purpose |
|-----|-----------|---------|
| crm-tracker | Discord | Indirectly through account-health-monitor agent |

---

## Permission Status

| Connector | Permission Type | Agents With Grant | Functions With Grant |
|-----------|----------------|-------------------|---------------------|
| Discord | connector.use | 3 (account-health-monitor, operations-coordinator, support-reply-drafter) | 3 (collect_resolved_tickets, finalize_slippage_review, finalize_dispatch) |
| Gmail | connector.use | 1 (support-reply-drafter) | 0 |
| Facebook | connector.use | 1 (request-classifier) | 0 |
| Instagram | connector.use | 1 (request-classifier) | 0 |
| Reddit | connector.use | 1 (support-reply-drafter) | 0 |

---

## Pending/Incomplete Integrations

| Connector | Gap | Impact |
|-----------|-----|--------|
| WhatsApp | Not available on platform | Cannot be integrated |
| Facebook | Inbound message reading documented but not confirmed working | request-classifier may fail at runtime |
| Instagram | Inbound message reading documented but not confirmed working | request-classifier may fail at runtime |
| Gmail | Outbound sending documented but not confirmed working | support-reply-drafter may fail to send replies |
| Reddit | Read-only, no reply capability | support-reply-drafter can monitor but not respond |

---

## Recommendations

1. **Verify Facebook/Instagram connector grants** actually work in the Lemma pod
2. **Verify Gmail outbound integration** before deploying support-reply-drafter in production
3. **Test all Discord notifications** end-to-end (most heavily used connector)
4. **Consider removing connector use from agent instructions** if integrations are not functional (avoid runtime errors)
5. **Add connector status** documentation to each agent's tool-access.md
