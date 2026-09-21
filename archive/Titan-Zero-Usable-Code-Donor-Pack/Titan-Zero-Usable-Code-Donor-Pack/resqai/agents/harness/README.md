# Agent Runtime Harness

Run any ResQAI agent locally outside the Lemma platform.

## Prerequisites

- Node.js 18+
- `npm install` completed in the project root
- Lemma pod credentials set as environment variables:
  - `LEMMA_POD_ID` (or `VITE_LEMMA_POD_ID`)

Optional:
- `LEMMA_API_URL` (default: `https://api.lemma.ai`)
- `LEMMA_AUTH_URL` (default: `https://auth.lemma.ai`)

## Usage

```bash
# Windows
agents\harness\run.cmd <agent-name> <input-file>

# Any platform
npx tsx agents/harness/run.ts <agent-name> <input-file>
```

### Arguments

| Argument     | Description                                      |
| ------------ | ------------------------------------------------ |
| `agent-name` | Directory name under `agents/` (e.g. `request-classifier`) |
| `input-file` | Path to a JSON file with the agent input         |

### Example

```bash
npx tsx agents/harness/run.ts request-classifier agents/harness/example-inputs/classify-ticket.json
```

## Agents

| Agent                    | Description                              |
| ------------------------ | ---------------------------------------- |
| `request-classifier`     | Classifies inbound customer requests     |
| `support-reply-drafter`  | Drafts customer-facing replies           |
| `operations-coordinator` | Coordinates operational recommendations  |
| `resolution-advisor`     | Analyzes disputes and recommends resolutions |
| `account-health-monitor` | Monitors account health and flags risks  |
| `tech-suggester`         | Suggests the best technician for a job   |

## Example Inputs

Pre-built examples are in `agents/harness/example-inputs/`:

| File                       | Agent                    |
| -------------------------- | ------------------------ |
| `classify-ticket.json`     | `request-classifier`     |
| `draft-reply.json`         | `support-reply-drafter`  |
| `coordinate-operations.json` | `operations-coordinator` |
| `resolve-dispute.json`     | `resolution-advisor`     |
| `health-monitor.json`      | `account-health-monitor` |
| `suggest-technician.json`  | `tech-suggester`         |

## How It Works

1. Loads the agent's `input-schema.json` and validates your input
2. Connects to Lemma via `LemmaClient`
3. Calls `agents.run()` with the agent name and stringified input
4. Polls `conversations.messages.list()` every 1.5s for the final answer
5. Prints the agent's structured output as JSON (or raw text if unparseable)

Timeout: 135 seconds. If no final answer is received, the harness exits with code 1.
