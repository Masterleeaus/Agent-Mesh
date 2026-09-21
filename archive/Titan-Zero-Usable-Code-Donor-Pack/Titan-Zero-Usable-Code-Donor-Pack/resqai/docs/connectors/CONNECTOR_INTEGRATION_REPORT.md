# Connector Integration Report — ResQAI

## Summary

All 5 enabled connectors (Gmail, Discord, Reddit, Facebook, Instagram) have been integrated into the existing ResQAI pod agents, functions, workflows, and applications. No new connectors were created. All integrations reuse existing agents, workflows, functions, and tables.

---

## 1. Workflows → Connector Mapping

| Workflow | Connectors Used | Via | Integration Point |
|---|---|---|---|
| **ticket-intake** | Gmail | `update_ticket_record` function | Sends email notification to customer when `approved_to_send == true` |
| **urgent-dispatch** | Discord | `finalize_dispatch` function | Posts dispatch alert to `#support-alerts` on Discord |
| **support-escalation-manager** | Discord | `operations-coordinator` agent instruction | Agent posts escalation alerts to Discord support channel |
| **dispute-resolution** | Discord, Gmail | `resolve_dispute` function | Posts resolution/rejection notifications to `#support-escalations` on Discord |
| **customer-satisfaction-monitor** | Discord | `collect_resolved_tickets` function | Posts daily monitor summary to `#support-reviews` on Discord |
| **followup-slippage-detector** | Discord | `finalize_slippage_review` function | Posts followup slippage alert to `#support-alerts` on Discord |
| **account-health-monitoring** | Discord | `update_account_health_status` function | Posts critical account alert to `#support-alerts` on Discord |
| **daily-standup** | Discord | `operations-coordinator` agent instruction | Agent posts daily standup summary to Discord operations channel |
| **appointment-reminders** | (none yet) | — | No connector integration; reminder dispatch pending |
| **appointment-assignment** | (none yet) | — | No connector integration; manager approval node handles assignment |
| **account-health** | Discord | `account_health_monitor` agent instruction | Agent posts critical/slipping account alerts to Discord support channel |

---

## 2. Agents → Connector Mapping

| Agent | Connectors | Permission | Usage in Instruction |
|---|---|---|---|
| **support-reply-drafter** | Gmail, Reddit | `connector.use` on both | Gmail: send approved drafts. Reddit: research similar issues for richer drafts. |
| **request-classifier** | Facebook, Instagram | `connector.use` on both | Facebook: read customer messages and create tickets. Instagram: read business messages and create tickets. |
| **resolution-advisor** | Reddit | `connector.use` | Search community discussions for similar dispute resolution patterns. |
| **operations-coordinator** | Discord | `connector.use` | Post escalation alerts, critical ticket notifications, and daily standup summaries to Discord. |
| **account-health-monitor** | Discord | `connector.use` | Post critical account alerts and slipping acceleration warnings to Discord support channel. |

---

## 3. Functions → Connector Mapping

| Function | Connectors | Permission | Call Pattern |
|---|---|---|---|
| **update_ticket_record** | Gmail | `connector.use` | `pod.connectors.execute("resqai-gmail", "gmail_send_email", {...})` when `approved_to_send == true` |
| **finalize_dispatch** | Discord | `connector.use` | `pod.connectors.execute("resqai-discord", "chat_post_message", {...})` after urgent dispatch |
| **resolve_dispute** | Discord, Gmail | `connector.use` on both | Discord notification on both approve and reject paths |
| **update_account_health_status** | Discord | `connector.use` | Discord notification when `health_category == "critical"` |
| **finalize_slippage_review** | Discord | `connector.use` | Discord notification when approved and slipping count > 0 |
| **collect_resolved_tickets** | Discord | `connector.use` | Discord notification when resolved tickets found |
| **check_ticket_urgency** | (none) | — | Pure routing function; no connector needed |
| **account_health_scan** | (none) | — | Pure analytical function; no connector needed |
| **flag_slipping_followups** | (none) | — | Pure analytical function; no connector needed |
| **assign_appointment_technician** | (none) | — | Pure CRUD function; no connector needed |

---

## 4. Applications → Connector Mapping

| Application | Connectors | Integration |
|---|---|---|
| **support-queue** | Gmail | `markSent()` triggers `update_ticket_record` function which sends Gmail notification |
| **ops-dashboard** | Discord | Logs Discord notification status after coordinator runs; agent posts standup summaries to Discord |
| **crm-tracker** | Discord | Exports `sendDiscordAlert()` function; agent posts critical account alerts to Discord |
| **resolution-center** | Reddit | Exports `searchRedditCommunity()` function; agent uses Reddit for dispute research |
| **appointment-board** | (none) | No direct connector integration |

---

## 5. Permissions Required

### Connector grants (`connector.use`)

| Resource (Connector) | Granted To |
|---|---|
| **gmail** | `support-reply-drafter` agent, `update_ticket_record` function, `resolve_dispute` function |
| **discord** | `operations-coordinator` agent, `account-health-monitor` agent, `finalize_dispatch` function, `resolve_dispute` function, `update_account_health_status` function, `finalize_slippage_review` function, `collect_resolved_tickets` function |
| **reddit** | `support-reply-drafter` agent, `resolution-advisor` agent |
| **facebook** | `request-classifier` agent |
| **instagram** | `request-classifier` agent |

### Auth Config Names (expected)

These must match the actual auth config names in the Lemma pod. Update in code if different:

| Connector | Auth Config Name | Provider |
|---|---|---|
| Gmail | `resqai-gmail` | LEMMA (default) |
| Discord | `resqai-discord` | LEMMA (default) |
| Reddit | `resqai-reddit` | LEMMA (default) |
| Facebook | `resqai-facebook` | LEMMA (default) |
| Instagram | `resqai-instagram` | LEMMA (default) |

### Prerequisite CLI Commands

```bash
# Verify connector auth configs exist
lemma connectors overview

# If auth configs need to be created:
lemma connectors auth-configs create gmail --name resqai-gmail
lemma connectors auth-configs create discord --name resqai-discord
lemma connectors auth-configs create reddit --name resqai-reddit
lemma connectors auth-configs create facebook --name resqai-facebook
lemma connectors auth-configs create instagram --name resqai-instagram
```

---

## 6. Connectors Still Pending / Not Integrated

| Connector | Status | Notes |
|---|---|---|
| **WhatsApp Business** | **Not available** | Specifically called out as unavailable. Not implemented. |
| **Facebook** (inbound triggers) | Partially integrated | Agent instruction allows reading messages and creating tickets. Webhook triggers for automatic inbound detection not configured — requires WEBHOOK schedule setup in the pod. |
| **Instagram** (inbound triggers) | Partially integrated | Same as Facebook — agent instruction covers reading messages. Webhook triggers for automatic inbound not configured. |
| **Gmail** (inbound triggers) | Not integrated | Only outbound send is implemented. Inbound email → ticket creation not configured. |
| **Reddit** | Fully integrated | Agents can search for community discussions. No outbound posting configured (read-only). |

---

## 7. Files Modified

### Agent permissions (5 files)
- `agents/support-reply-drafter/permissions.json` — added gmail, reddit grants
- `agents/request-classifier/permissions.json` — added facebook, instagram grants
- `agents/resolution-advisor/permissions.json` — added reddit grant
- `agents/operations-coordinator/permissions.json` — added discord grant
- `agents/account-health-monitor/permissions.json` — added discord grant

### Agent instructions (5 files)
- `agents/support-reply-drafter/instruction.md` — added Gmail/Reddit connector section, updated core send restriction
- `agents/request-classifier/instruction.md` — added Facebook/Instagram connector section
- `agents/resolution-advisor/instruction.md` — added Reddit connector section
- `agents/operations-coordinator/instruction.md` — added Discord connector section
- `agents/account-health-monitor/instruction.md` — added Discord connector section

### Function permissions (6 files)
- `functions/update-ticket-record/function.json` — added gmail grant
- `functions/finalize-dispatch/finalize-dispatch.json` — added discord grant
- `functions/resolve_dispute/resolve_dispute.json` — added discord, gmail grants
- `functions/update_account_health_status/update_account_health_status.json` — added discord grant
- `functions/finalize_slippage_review/finalize_slippage_review.json` — added discord grant
- `functions/collect_resolved_tickets/collect_resolved_tickets.json` — added discord grant

### Function code (6 files)
- `functions/update-ticket-record/src/handler.py` — added Gmail send on approved_to_send
- `functions/finalize-dispatch/code.py` — added Discord notification on dispatch
- `functions/resolve_dispute/code.py` — added Discord notification on approve/reject
- `functions/update_account_health_status/code.py` — added Discord notification on critical
- `functions/finalize_slippage_review/code.py` — added Discord notification on approved slippage
- `functions/collect_resolved_tickets/code.py` — added Discord notification on tickets found

### Shared SDK (1 file)
- `shared/sdk/lemma-sdk.ts` — added `runConnectorOperation()` function

### App services (4 files)
- `apps/support-queue/services/ticket-service.ts` — added Gmail trigger on `markSent()`
- `apps/ops-dashboard/services/dashboard-service.ts` — added Discord notification status logging
- `apps/crm-tracker/services/crm-service.ts` — added `sendDiscordAlert()` function
- `apps/resolution-center/services/dispute-service.ts` — added `searchRedditCommunity()` function

---

## 8. Usage by Connector

### Gmail
- **Outbound:** Send support reply emails to customers when ticket is approved
- **Triggered by:** `workflow:ticket-intake` via `update_ticket_record`, or manually via `support-queue` app `markSent()`
- **Agents:** support-reply-drafter
- **Functions:** update_ticket_record, resolve_dispute

### Discord
- **Outbound:** Support team notifications, escalation alerts, critical ticket/dipute/account alerts
- **Triggered by:** urgent-dispatch, support-escalation-manager, dispute-resolution, customer-satisfaction-monitor, followup-slippage-detector, account-health-monitoring, daily-standup workflows
- **Agents:** operations-coordinator, account-health-monitor
- **Functions:** finalize_dispatch, resolve_dispute, update_account_health_status, finalize_slippage_review, collect_resolved_tickets

### Reddit
- **Read-only:** Search community discussions for similar issues and resolution patterns
- **Triggered by:** Agents during drafting and dispute analysis
- **Agents:** support-reply-drafter, resolution-advisor

### Facebook
- **Read-only:** Read customer messages, create support tickets from incoming requests
- **Triggered by:** Agent instruction (when `source: "facebook"`)
- **Agents:** request-classifier
- **Pending:** WEBHOOK schedule for automatic inbound message detection

### Instagram
- **Read-only:** Read business messages, create support tickets from customer conversations
- **Triggered by:** Agent instruction (when `source: "instagram"`)
- **Agents:** request-classifier
- **Pending:** WEBHOOK schedule for automatic inbound message detection
