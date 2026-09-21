# RESQAI V2 — Connector Architecture

> Phase 1.5 — Architecture Only  
> Principal Integration Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Connector Inventory](#2-connector-inventory)
3. [Authentication Model](#3-authentication-model)
4. [Rate Limiting & Throttling](#4-rate-limiting--throttling)
5. [Fallback & Circuit Breaker](#5-fallback--circuit-breaker)
6. [Health Monitoring](#6-health-monitoring)
7. [Credential Lifecycle](#7-credential-lifecycle)

---

## 1. Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Functions never call external APIs directly** | All external communication is routed through connectors |
| 2 | **Connectors are configured, not coded** | Each connector is an entry in `connectors_v2` with type-specific config |
| 3 | **Credential isolation** | Connector credentials are encrypted at rest; never logged or exposed |
| 4 | **Circuit breaker per connector** | Failed connectors are automatically isolated to prevent cascading failures |
| 5 | **Health checks on schedule** | Every enabled connector is health-checked at configurable intervals |
| 6 | **Rate limiting per connector** | Each connector enforces provider-specific rate limits with queue backpressure |
| 7 | **Fallback chains** | Notifications support primary → secondary → tertiary channel fallback |
| 8 | **Audited connector calls** | Every external call is logged with connector_id, operation, status, duration |

---

## 2. Connector Inventory

### 2.1 Core Connectors

| Connector | Type | Purpose | Provider | Protocol |
|-----------|:----:|---------|----------|:--------:|
| SMTP | smtp | Transactional email | AWS SES / SendGrid | SMTP / API |
| Twilio SMS | sms_twilio | SMS notifications | Twilio | REST API |
| Discord Webhook | discord_webhook | Manager alerts | Discord | Webhook |
| Slack | slack | Team notifications | Slack | Webhook / API |
| Gmail | gmail | Customer email replies | Google Gmail API | REST API (OAuth 2.0) |
| Reddit | reddit | Social media monitoring | Reddit API | REST API (OAuth 2.0) |

### 2.2 Connector Capability Matrix

| Connector | Send Notification | Receive Webhook | Batch Capability | Max Payload | Channels |
|-----------|:----------------:|:---------------:|:----------------:|:-----------:|:--------:|
| SMTP | ✓ | — | ✓ (bulk send) | 25MB (with attachment) | Email |
| Twilio SMS | ✓ | ✓ (delivery receipt) | — | 1600 chars (segmented) | SMS |
| Discord Webhook | ✓ | — | — | 2000 chars | Discord |
| Slack | ✓ | ✓ (slash command) | — | 40000 chars | Slack |
| Gmail | ✓ | ✓ (watch) | — | 25MB | Email |
| Reddit | — | ✓ (monitor) | — | N/A | Reddit (read-only) |

### 2.3 Connector Type Configuration Schema

```json
{
  "smtp": {
    "required": ["host", "port", "username", "password"],
    "optional": ["from_address", "from_name", "tls"],
    "encrypted": ["password"]
  },
  "sms_twilio": {
    "required": ["account_sid", "auth_token", "from_number"],
    "optional": ["messaging_service_sid"],
    "encrypted": ["auth_token"]
  },
  "discord_webhook": {
    "required": ["webhook_url"],
    "optional": ["bot_token", "channel_id"],
    "encrypted": ["webhook_url", "bot_token"]
  },
  "slack": {
    "required": ["webhook_url"],
    "optional": ["bot_token", "channel", "signing_secret"],
    "encrypted": ["webhook_url", "bot_token", "signing_secret"]
  },
  "gmail": {
    "required": ["client_id", "client_secret", "refresh_token"],
    "optional": ["impersonated_user"],
    "encrypted": ["client_secret", "refresh_token"]
  },
  "reddit": {
    "required": ["client_id", "client_secret", "username", "password"],
    "optional": ["user_agent"],
    "encrypted": ["client_secret", "password"]
  }
}
```

---

## 3. Authentication Model

### 3.1 Auth Type by Connector

| Connector | Auth Method | Credential Rotation | TTL |
|-----------|:-----------:|:-------------------:|:---:|
| SMTP | Password-based | Manual | No expiry |
| Twilio SMS | API Key (SID + Token) | Manual | No expiry |
| Discord Webhook | Webhook URL (token in URL) | Regenerate URL | No expiry |
| Slack | Webhook URL / Bot Token | Manual | No expiry |
| Gmail | OAuth 2.0 (3-legged) | Refresh token rotation | 7-day refresh token |
| Reddit | OAuth 2.0 (password grant) | Manual | 1-hour access token |

### 3.2 Credential Storage

```
connectors_v2.config column:
  - All sensitive fields are encrypted with AES-256-GCM
  - Encryption key stored in system_settings_v2 (key: "connector.encryption_key")
  - Key rotated on schedule (quarterly) or on security event
  - Encrypted values are never exposed in logs, API responses, or audit trails
```

---

## 4. Rate Limiting & Throttling

### 4.1 Provider Rate Limits

| Connector | Limit | Window | Burst | Behavior When Exceeded |
|-----------|:-----:|:------:|:-----:|------------------------|
| SMTP | 14 emails/sec | Per second | 20 | Queue with 100ms backoff |
| Twilio SMS | 1 msg/sec | Per second | 3 | Queue with 1s backoff |
| Discord Webhook | 5 req/sec | Per second | 10 | Queue; batch if possible |
| Slack | 1 req/sec | Per second | 3 | Queue with 1s backoff |
| Gmail | 250 msgs/user/day | Per day | 10/sec | Queue; partial delivery |
| Reddit | 60 req/min | Per minute | 10/min | Queue with exponential backoff |

### 4.2 Rate Limiter Implementation

```
┌─────────────────┐
│  dispatch-notif  │
│  (function)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Connector Router    │
│  (per-connector      │
│   rate limiter)      │
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
  Pass      Throttled
    │           │
    ▼           ▼
  Execute    Queue (FIFO)
    │        with backoff
    ▼           │
  Log call      ▼
              Retry in N ms
```

### 4.3 Per-Connector Rate Limit Configuration

Rate limits are stored in `system_settings_v2`:

| Setting Key | Default | Per-Connector Override |
|-------------|:-------:|:----------------------:|
| `connector.{type}.rate_limit` | Per table above | system_settings_v2 per connector_id |
| `connector.{type}.burst_size` | Per table above | system_settings_v2 per connector_id |
| `connector.{type}.backoff_ms` | 100-1000 | system_settings_v2 per connector_id |

---

## 5. Fallback & Circuit Breaker

### 5.1 Notification Channel Fallback Chain

| Primary Channel | Fallback 1 | Fallback 2 | Fallback 3 |
|:---------------:|:----------:|:----------:|:----------:|
| Email (SMTP) | Email (Gmail) | SMS | — |
| SMS (Twilio) | Email | In-app | — |
| Discord | Slack | Email | SMS |
| Slack | Email | In-app | — |
| In-app | Email | — | — |

### 5.2 Circuit Breaker States

```
                  ┌──────────┐
                  │  CLOSED   │
                  │ (healthy) │
                  └────┬─────┘
                       │
              Failure threshold exceeded
              (5 failures / 60s window)
                       │
                       ▼
                  ┌──────────┐
                  │   OPEN    │
                  │ (tripped) │
                  └────┬─────┘
                       │
              Timeout expires (60s)
                       │
                       ▼
                  ┌──────────────┐
                  │  HALF_OPEN    │
                  │ (test request)│
                  └──────┬───────┘
                        / \
                  Pass /     \ Fail
                      /       \
                     ▼         ▼
               ┌────────┐ ┌──────────┐
               │ CLOSED │ │   OPEN    │
               └────────┘ │ (retry)   │
                          └──────────┘
```

### 5.3 Circuit Breaker Configuration

| Parameter | Default | Description |
|-----------|:-------:|-------------|
| Failure threshold | 5 | Consecutive failures in window |
| Window size | 60s | Rolling window for failure counting |
| Open timeout | 60s | Time before transitioning to half-open |
| Half-open max requests | 1 | Requests allowed in half-open state |

---

## 6. Health Monitoring

### 6.1 Health Check Strategy

| Connector | Check Type | Interval | Action on Failure |
|-----------|:----------:|:--------:|-------------------|
| SMTP | Telnet / API test | 5min | Circuit breaker → fallback |
| Twilio SMS | API status endpoint | 5min | Circuit breaker → fallback |
| Discord Webhook | Webhook ping | 15min | Circuit breaker → fallback |
| Slack | API auth.test | 15min | Circuit breaker → fallback |
| Gmail | API users.getProfile | 5min | Circuit breaker → fallback + token refresh |
| Reddit | API /api/v1/me | 15min | Alert (reddit is read-only) |

### 6.2 Health Status Lifecycle

```
unknown → connected (first successful check)
connected → error (health check fails)
error → connected (subsequent check passes)
error → disconnected (n consecutive failures)
disconnected → connected (manual re-enable or auto-recovery)
```

---

## 7. Credential Lifecycle

### 7.1 Rotation Schedule

| Connector | Rotation Schedule | Method | Downtime |
|-----------|:-----------------:|--------|:--------:|
| SMTP | Manual | Update connectors_v2 | <1s |
| Twilio SMS | Quarterly | Generate new API key | <1s |
| Discord Webhook | Annually | Regenerate webhook URL | <1s |
| Slack | Annually | Regenerate token | <1s |
| Gmail | Every 7 days | Auto-refresh token | Zero |
| Reddit | Monthly | Generate new app password | <1s |

### 7.2 Rotation Flow

```
1. admin-connector-manager_v2 detects credential nearing expiry
2. Human admin initiates rotation (or scheduled auto-rotation)
3. New credential generated at provider
4. New credential stored in connectors_v2 (encrypted)
5. Old credential backed up in audit trail (fingerprint only)
6. Health check validates new credential
7. On success → old credential destroyed; On failure → rollback
```

---

> **End of CONNECTOR_ARCHITECTURE.md**  
> Next document: CONNECTOR_MATRIX.md
