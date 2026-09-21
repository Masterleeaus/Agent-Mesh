# AI Runtime Report — ResQAI V2 Phase C.2

**Date:** 2026-07-01  
**Runtime Version:** 2.0.0  
**Package:** `@resqai/runtime`  
**Location:** `packages/runtime/`

---

## Architecture Overview

The AI Runtime is the unified execution layer for every ResQAI enterprise agent. It
replaces the previous per-agent harness pattern with a single pipelined engine that
handles provider abstraction, context management, memory, retry, timeout,
observability, cost control, human fallback, and confidence routing.

```
┌──────────────────────────────────────────────────────────┐
│                    AI Runtime Engine                      │
├──────────────────────────────────────────────────────────┤
│  Config → Context → Provider → Retry → Timeout → Output  │
│             ↕        ↕         ↕       ↕                  │
│          Memory  Cost Ctrl  Observability  Logging        │
│             ↕                                            │
│    Confidence → Router → Fallback → Human Queue          │
└──────────────────────────────────────────────────────────┘
```

---

## Modules Implemented

### 1. Runtime Configuration (`src/config/`)

| File | Purpose |
|------|---------|
| `index.ts` | `loadRuntimeConfig()` — merges defaults, env vars, per-agent overrides |
| `schema.ts` | All default config values for every subsystem |

**Env vars consumed:**
- `AI_PROVIDER` — default `"lemma"`
- `AI_MODEL` — model identifier
- `AI_BUDGET_CENTS` — per-session budget
- `RUNTIME_LOG_LEVEL` — `"debug" | "info" | "warn" | "error"`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` — for non-Lemma providers

### 2. Model Providers (`src/providers/`)

| File | Provider | Auth |
|------|----------|------|
| `index.ts` | Registry + `LLMProvider` interface | — |
| `lemma-provider.ts` | Lemma native (`LemmaClient`) | `LEMMA_POD_ID`, `LEMMA_API_URL`, `LEMMA_AUTH_URL` |
| `openai-provider.ts` | OpenAI (`gpt-4o`, `gpt-4o-mini`, etc.) | `OPENAI_API_KEY` |
| `anthropic-provider.ts` | Anthropic (`claude-3.5-sonnet`, `claude-3-haiku`) | `ANTHROPIC_API_KEY` |

**Provider interface:**
```typescript
interface LLMProvider {
  execute(messages, config) → LLMResponse { content, usage, latencyMs, finishReason }
  countTokens(text, model?) → number
  estimateCost(inputTokens, outputTokens, model?) → CostEstimate
}
```

### 3. Agent Execution Engine (`src/engine/`)

| File | Purpose |
|------|---------|
| `pipeline.ts` | `executeAgent()` — full execution pipeline |
| `retry.ts` | Exponential backoff, retryable error detection |
| `timeout.ts` | `ExecutionTimeoutError`, `createTimeoutPromise()` |
| `index.ts` | Re-exports |

**Pipeline flow:**
1. Load config → Create runtime context → Init observability
2. Load memory → Build messages from instruction + input
3. Apply window strategy → Compress if over limit
4. Check budget → Degrade model if needed
5. Execute provider with retry loop (exponential backoff)
6. Parse output → Evaluate confidence → Route by confidence
7. Handle fallback → Log → Record metrics → Return `ExecutionResult`

### 4. Context System (`src/context/`)

| File | Purpose |
|------|---------|
| `index.ts` | Context creation, message building, window strategies, compression |

**Window strategies:**
| Strategy | Behavior |
|----------|----------|
| `truncate` | Keep system messages + last N non-system messages |
| `sliding` | Keep system + last M messages (M based on maxTokens) |
| `summary` | No truncation (rely on model context window) |
| `hybrid` | Combine sliding window with compression |

### 5. Memory System (`src/memory/`)

| Feature | Implementation |
|---------|---------------|
| Short-term | In-memory message buffer, auto-summarizes when exceeding `maxMessages` |
| Long-term | Entry store with summary, retrieved by recency or keyword scoring |
| Summary | `generateMemorySummary()` — concatenates last 10 long-term entries |
| TTL | Configurable auto-eviction (default 24h) |
| Persistence | In-memory `Map` keyed by `agentName:sessionId` |

### 6. Observability (`src/observability/`)

| Feature | Implementation |
|---------|---------------|
| Spans | `startSpan()`, `endSpan()`, `addSpanEvent()`, `setSpanAttribute()` |
| Tracing | Trace tree via `traceId` + `parentSpanId` |
| Metrics | `recordExecutionMetrics()` — agent, duration, spans, cost, confidence |
| Export | Optional HTTP POST to `exportEndpoint` |

### 7. Logging (`src/logger/`)

| Feature | Implementation |
|---------|---------------|
| Levels | `debug`, `info`, `warn`, `error` with level filtering |
| Format | Structured JSON — `{ level, message, timestamp, meta }` |
| Output | Console (stdout/stderr), file, or both |
| Events | Execution start/complete, retries, fallbacks, cost alerts |

### 8. Cost Control (`src/cost/`)

| Feature | Implementation |
|---------|---------------|
| Cost calculation | Token-based with per-model rates |
| Budget | Per-agent session budget in cents, checked before each execution |
| Alerts | Configurable threshold (`alertThreshold`, default 80%) |
| Degradation | `shouldDegradeModel()` — switch to cheaper model when budget tight |

**Default model rates (per 1K tokens, USD):**

| Model | Input | Output |
|-------|-------|--------|
| lemma | $0.003 | $0.015 |
| gpt-4o | $0.01 | $0.03 |
| gpt-4o-mini | $0.0015 | $0.006 |
| claude-3.5-sonnet | $0.003 | $0.015 |
| claude-3-haiku | $0.00025 | $0.00125 |

### 9. Human Fallback (`src/fallback/`)

| Feature | Implementation |
|---------|---------------|
| Queue | In-memory `Map<agentName, FallbackRequest[]>` |
| Fallback model | Configurable alternative provider/model |
| Escalation | Role-based escalation targets with channel and notification flag |
| Auto-escalate | Configurable timeout before auto-escalation (default 5 min) |

**Actions:** `retry` → `fallback_model` → `human_queue` → `escalate` → `degrade`

### 10. Confidence Routing (`src/routing/`)

| Threshold | Default | Action |
|-----------|---------|--------|
| `autoExecute` | ≥ 0.80 | Execute normally |
| `requireReview` | ≥ 0.60 | Route to human review |
| `escalate` | ≥ 0.40 | Escalate to ops manager |
| `fallback` | ≥ 0.20 | Fallback to alternative provider |

---

## Verified Agents

All five enterprise agents are now configured with the AI Runtime:

| Agent | Runtime Config | Execution Mode | Max Retries | Timeout | Context Window | Memory |
|-------|---------------|---------------|-------------|---------|---------------|--------|
| **request-classifier** | `agents/request-classifier/runtime.json` | auto | 3 | 120s | 64K hybrid | conversation (30) |
| **operations-coordinator** | `agents/operations-coordinator/runtime.json` | auto | 3 | 180s | 96K hybrid | hybrid (50) |
| **resolution-advisor** | `agents/resolution-advisor/runtime.json` | semi-auto | 2 | 180s | 64K sliding | conversation (40) |
| **tech-suggester** | `agents/tech-suggester/runtime.json` | auto | 2 | 90s | 32K sliding | none |
| **account-health-monitor** | `agents/account-health-monitor/runtime.json` | semi-auto | 3 | 180s | 96K hybrid | hybrid (60) |

### Agent-specific confidence thresholds:

| Agent | Auto-Execute | Require Review | Escalate |
|-------|-------------|----------------|----------|
| request-classifier | 0.85 | 0.60 | 0.30 |
| operations-coordinator | 0.80 | 0.50 | 0.30 |
| resolution-advisor | 0.85 | 0.60 | 0.40 |
| tech-suggester | 0.80 | 0.55 | 0.30 |
| account-health-monitor | 0.80 | 0.50 | 0.30 |

---

## File Inventory

```
packages/runtime/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                    # Main re-export
    ├── types.ts                    # All type definitions
    ├── config/
    │   ├── index.ts                # loadRuntimeConfig()
    │   └── schema.ts               # Defaults + constants
    ├── providers/
    │   ├── index.ts                # LLMProvider interface + registry
    │   ├── lemma-provider.ts       # Lemma native provider
    │   ├── openai-provider.ts      # OpenAI provider
    │   └── anthropic-provider.ts   # Anthropic provider
    ├── engine/
    │   ├── index.ts                # Re-exports
    │   ├── pipeline.ts             # executeAgent() — full pipeline
    │   ├── retry.ts                # Exponential backoff + retry logic
    │   └── timeout.ts              # Timeout management
    ├── context/
    │   └── index.ts                # Context creation, window strategies, compression
    ├── memory/
    │   └── index.ts                # Short/long-term memory, summarization, TTL
    ├── logger/
    │   └── index.ts                # Structured JSON logger
    ├── observability/
    │   └── index.ts                # Spans, traces, metrics, export
    ├── cost/
    │   └── index.ts                # Token counting, cost calc, budget enforcement
    ├── fallback/
    │   └── index.ts                # Human queue, escalation, fallback model
    └── routing/
        └── index.ts                # Confidence evaluation + routing decisions

Agent runtime configs:
agents/request-classifier/runtime.json
agents/operations-coordinator/runtime.json
agents/resolution-advisor/runtime.json
agents/tech-suggester/runtime.json
agents/account-health-monitor/runtime.json

Updated harness:
agents/harness/run.ts
```

---

## Usage

### Run a single agent via the harness:

```bash
npx tsx agents/harness/run.ts request-classifier agents/harness/example-inputs/classify-ticket.json
```

### Run with raw output (no JSON parsing):

```bash
npx tsx agents/harness/run.ts request-classifier input.json --raw
```

### Execute programmatically:

```typescript
import { executeAgent } from '@resqai/runtime/engine';

const result = await executeAgent({
  agentName: 'request-classifier',
  instruction: '...',  // from instruction.md
  input: { ticket_id: 'abc-123' },
});

console.log(result.output);       // parsed agent response
console.log(result.status);       // 'success' | 'failure' | 'fallback'
console.log(result.confidence);   // 0-1 score
console.log(result.routingAction); // routing decision
console.log(result.cost);         // token usage + cost
```

### Provider switching:

```bash
# Use OpenAI GPT-4o-mini instead of Lemma
AI_PROVIDER=openai AI_MODEL=gpt-4o-mini npx tsx agents/harness/run.ts request-classifier input.json

# Use Anthropic Claude 3.5 Sonnet
AI_PROVIDER=anthropic AI_MODEL=claude-3.5-sonnet npx tsx agents/harness/run.ts request-classifier input.json
```

---

## ExecutionResult Contract

```typescript
{
  agentName: string;          // Agent name
  runId: string;              // Unique execution ID
  status: AgentStatus;        // 'pending' | 'running' | 'success' | 'failure' | 'timeout' | 'fallback' | 'cancelled'
  output: unknown;            // Parsed agent response (JSON or string)
  confidence: number;         // Confidence score 0-1
  routingAction: RoutingAction; // 'execute' | 'fallback_human' | 'escalate' | 'retry' | 'degrade'
  timing: {
    startedAt: string;        // ISO timestamp
    completedAt: string;      // ISO timestamp
    durationMs: number;       // Total wall-clock time
    llmCallMs: number;        // LLM execution time
    contextLoadMs: number;    // Context loading time
    retryWaitMs: number;      // Total retry backoff time
  };
  cost: {
    totalCents: number;       // Total cost in cents
    inputTokens: number;      // Input token count
    outputTokens: number;     // Output token count
    inputCostCents: number;   // Input cost in cents
    outputCostCents: number;  // Output cost in cents
    estimatedTotal: number;   // Estimated cost in dollars
    budgetExceeded: boolean;  // Whether budget was exceeded
  };
  errors: ExecutionError[];   // Detailed error log per attempt
  metadata: Record<string, unknown>; // Session ID, message count, fallback info
  traceId: string;            // Observability trace ID
}
```

---

## Verification

To verify the runtime is working:

```bash
# Set Lemma env vars first
set LEMMA_POD_ID=your_pod_id

# Run request-classifier with test input
npx tsx agents/harness/run.ts request-classifier agents/harness/example-inputs/classify-ticket.json

# Expected output includes:
# Status: success
# Duration: <N>ms
# Confidence: 0.85
# Routing: execute
# Cost: <N> cents (N in / N out)
```

---

## Future Extensions

- **Persistence backend** for memory (Redis, filesystem)
- **Streaming provider support** for real-time output
- **OTel-compatible trace export** (OpenTelemetry)
- **Dynamic model routing** per-turn based on task complexity
- **Multi-region failover** across provider endpoints
- **Rate-limit-aware scheduling** with queue depth management
