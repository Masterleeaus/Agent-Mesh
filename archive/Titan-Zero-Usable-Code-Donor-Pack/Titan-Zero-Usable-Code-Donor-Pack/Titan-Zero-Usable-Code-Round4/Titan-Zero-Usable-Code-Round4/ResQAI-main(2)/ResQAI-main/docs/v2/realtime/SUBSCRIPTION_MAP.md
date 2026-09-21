# SUBSCRIPTION MAP — ResQAI V2

## 1. Subscription Registry

Global mapping of every active subscription across the platform, keyed by `(app, channel, event)`.

## 2. Per-App Subscription Tables

### 2.1 Support Queue

| Route / Component | Channel | Events | Auth Scope | TTL / Cleanup |
|---|---|---|---|---|
| `/` (TicketList) | `private-app-support-queue-ticket` | `ticket.created`, `ticket.status.changed`, `ticket.deleted` | `app:support-queue` | On unmount |
| `/ticket/:id` (TicketDetail) | `private-entity-ticket-{id}` | `ticket.status.changed`, `ticket.escalated`, `ticket.sla_breached`, `ticket_message.*` | `app:support-queue` | On unmount or nav away |
| (Global) | `private-user-{userId}` | `notification.*`, `ticket.assigned` | `user:{userId}` | Session lifetime |
| (FilterBar) | `private-app-support-queue-ticket` | `ticket.created`, `ticket.status.changed` | `app:support-queue` | On unmount |
| (Optimistic bound) | `private-entity-ticket-{id}` | `ticket.update.confirmed`, `ticket.update.rejected` | `app:support-queue` | Per-mutation lifecycle |

### 2.2 Ops Dashboard

| Route / Component | Channel | Events | Auth Scope | TTL / Cleanup |
|---|---|---|---|---|
| `/` (DashboardView) | `private-org-{orgId}` | `ticket.*`, `dispute.*`, `appointment.*`, `work_order.*`, `task.*`, `audit_log.*` | `org:{orgId}` | On unmount |
| (KpiCards) | `private-org-{orgId}` | `ticket.*`, `dispute.*`, `appointment.*`, `work_order.*`, `task.*` | `org:{orgId}` | On unmount |
| (UrgentTickets) | `private-org-{orgId}` | `ticket.created`, `ticket.status.changed` | `org:{orgId}` | On unmount |
| (OperationsLog) | `private-org-{orgId}` | `audit_log.created` | `org:{orgId}` | On unmount |
| (CoordinatorAction) | `private-user-{userId}` | `coordinator.*` | `user:{userId}` | Per-action lifecycle |

### 2.3 Resolution Center

| Route / Component | Channel | Events | Auth Scope | TTL / Cleanup |
|---|---|---|---|---|
| `/` (DisputeList) | `private-app-resolution-center-dispute` | `dispute.created`, `dispute.analyzed`, `dispute.status.changed`, `dispute.deleted` | `app:resolution-center` | On unmount |
| `/dispute/:id` (DisputeDetail) | `private-entity-dispute-{id}` | `dispute.status.changed`, `dispute.analyzed`, `evidence.*` | `app:resolution-center` | On unmount or nav away |
| (KpiCards) | `private-app-resolution-center-dispute` | `dispute.created`, `dispute.status.changed` | `app:resolution-center` | On unmount |
| (Optimistic bound) | `private-entity-dispute-{id}` | `dispute.update.confirmed`, `dispute.update.rejected` | `app:resolution-center` | Per-mutation lifecycle |

### 2.4 CRM Tracker

| Route / Component | Channel | Events | Auth Scope | TTL / Cleanup |
|---|---|---|---|---|
| `/` (AccountList) | `private-app-crm-tracker-account` | `account.created`, `account.updated`, `account.deleted` | `app:crm-tracker` | On unmount |
| `/account/:id` (AccountDetail) | `private-entity-account-{id}` | `account.updated`, `account.health.changed`, `followup.*`, `task.*` | `app:crm-tracker` | On unmount or nav away |
| `/followups` (FollowupList) | `private-app-crm-tracker-followup` | `followup.created`, `followup.updated`, `followup.missed` | `app:crm-tracker` | On unmount |
| (HealthAlerts) | `private-user-{userId}` | `account.health.changed`, `followup.slippage.detected` | `user:{userId}` | Session lifetime |

### 2.5 Global / Shared Shell

| Component | Channel | Events | Auth Scope | TTL / Cleanup |
|---|---|---|---|---|
| NotificationBell | `private-user-{userId}` | `notification.*` | `user:{userId}` | Session lifetime |
| AppShell | `private-user-{userId}` | `user.session.expiring`, `system.*` | `user:{userId}` | Session lifetime |
| ThemeProvider | `private-org-{orgId}` | `system.settings.changed` | `org:{orgId}` | Session lifetime |

## 3. Subscription Count per Session

| App | Typical Subscriptions | Peak Subscriptions |
|---|---|---|
| Support Queue | 3 | 5 (list + detail + user + filter + optimistic) |
| Ops Dashboard | 3 | 5 (org + kpi + urgent + ops log + coordinator) |
| Resolution Center | 3 | 5 (list + detail + kpi + user + optimistic) |
| CRM Tracker | 3 | 5 (list + detail + followup + user + health) |
| Shared Shell | 3 | 3 (notifications + system + theme) |

## 4. Event-to-Subscription Fan-out

| Event | Subscriber Count | Subscribers |
|---|---|---|
| `ticket.created` | 3 | Support Queue List, Ops Dashboard, FilterBar |
| `ticket.status.changed` | 4 | Support Queue List + Detail, Ops Dashboard KPI + Urgent |
| `ticket.escalated` | 3 | Support Queue Detail, Ops Dashboard KPI, User Notification |
| `ticket.sla_breached` | 3 | Support Queue Detail, Ops Dashboard KPI, User Notification |
| `dispute.*` (per status change) | 3-4 | Resolution Center List + Detail + KPI, Ops Dashboard KPI |
| `dispute.analyzed` | 3 | Resolution Center Detail, KPI, Ops Dashboard KPI |
| `appointment.*` | 2 | Ops Dashboard KPI, Resolution Center KPI |
| `work_order.*` | 1 | Ops Dashboard KPI |
| `account.health.changed` | 2 | CRM Tracker Detail, User Notification |
| `followup.*` | 2 | CRM Tracker List, User Notification |
| `notification.*` | 1 | User private channel |
| `audit_log.created` | 1 | Ops Dashboard Operations Log |

## 5. Subscription Lifecycle Management

```
useEffect(() => {
  // Subscribe
  const channel = pusher.subscribe(channelName);
  eventNames.forEach(eventName => {
    channel.bind(eventName, handler);
  });

  // Register in subscription registry
  subscriptionRegistry.register({ app, channel: channelName, events: eventNames, userId });

  // Cleanup
  return () => {
    eventNames.forEach(eventName => {
      channel.unbind(eventName, handler);
    });
    pusher.unsubscribe(channelName);
    subscriptionRegistry.unregister({ app, channel: channelName });
  };
}, [dependencyKey]);
```

## 6. Subscription Registry Internal Schema

```typescript
interface SubscriptionEntry {
  id: string;                    // unique subscription id
  app: string;                   // app identifier
  userId: string;                // subscribing user
  channel: string;               // Pusher channel name
  events: string[];              // bound event names
  filters?: Record<string, unknown>; // optional event filters
  callback: string;              // callback function reference (for debugging)
  subscribedAt: Date;            // timestamp
  lastHeartbeat: Date;           // last ping received
  status: 'active' | 'stale' | 'orphaned';
}

interface SubscriptionRegistry {
  entries: Map<string, SubscriptionEntry>;
  byChannel: Map<string, Set<string>>;
  byUser: Map<string, Set<string>>;
  byApp: Map<string, Set<string>>;
}
```

## 7. Health Monitoring

| Check | Interval | Action on Failure |
|---|---|---|
| Active subscription count | 30s | Log warning if > 20 per user |
| Stale subscriptions (no heartbeat > 60s) | 30s | Mark stale; await re-registration |
| Orphaned subscriptions (user disconnected) | 60s | Force cleanup |
| Channel permission mismatch | On subscribe | Log + alert security team |
