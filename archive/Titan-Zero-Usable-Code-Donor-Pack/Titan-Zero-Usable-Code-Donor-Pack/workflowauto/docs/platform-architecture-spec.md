# Platform Architecture — Master Specification

**Version:** 1.0.0  
**Status:** Living Document  
**Author:** Platform Team  
**Date:** 2026-03-05

---

## 1. Purpose

This document captures the full architectural vision for the workflow automation platform — from the first hand-coded prototype through to the generalised marketplace runtime. It exists so that every incremental build decision is made with the end state in mind, and so that the transition from prototype to platform is a refactor, not a rewrite.

Read this alongside the component-level specs:

- `platform-auth-service-spec.md`
- `aspire-mcp-server-spec.md`
- `proposal-agent-spec.md`

---

## 2. The Problem Being Solved

Field service businesses using Aspire spend significant time on manual, repetitive document workflows — generating proposals, writing site reports, producing invoices — that require pulling data from Aspire, enriching it with AI-generated content, and writing results back. Each of these workflows follows the same pattern:

```
Fetch data from a system
  → Enrich with AI (text, images, analysis)
    → Review and refine (human in the loop)
      → Write results back to a system
```

The platform automates this pattern. The marketplace lets users discover, configure, and run these workflows without writing code. The platform runtime makes building new workflows fast for developers.

---

## 3. Layered Architecture — Target State

```
┌─────────────────────────────────────────────────────────┐
│                    Marketplace UI                        │
│         App discovery, installation, configuration       │
├─────────────────────────────────────────────────────────┤
│                   App Runtime Layer                      │
│   Step sequencing, UI generation, state management,      │
│   human-in-the-loop gates, error boundaries              │
├─────────────────────────────────────────────────────────┤
│               Platform Agent Library                     │
│      FetchAgent  ImageAgent  TextAgent  WriteAgent       │
│         (typed, reusable, connector-agnostic)            │
├─────────────────────────────────────────────────────────┤
│              MCP Connector Layer                         │
│   Aspire MCP Server  ·  Future connector MCP servers     │
│        (stateless, one per external system)              │
├─────────────────────────────────────────────────────────┤
│              Platform Auth Service                       │
│     Credential store · Token cache · Auth strategies     │
└─────────────────────────────────────────────────────────┘
```

Each layer has a single responsibility and depends only on the layer below it. Layers are independently deployable and testable.

---

## 4. Build Phases

### Phase 1 — Foundation ✅ Specced

**Goal:** Core infrastructure that every subsequent phase depends on.

```
platform-auth-service     Credential storage, token lifecycle
aspire-mcp-server         First connector, establishes MCP server pattern
```

Nothing above these layers can be built without them. They are stable once built — changes here are rare and breaking.

### Phase 2 — Hand-Coded Proposal Generator

**Goal:** Validate the full end-to-end workflow with a real user, real Aspire data, and a real UI. Learn what the runtime needs before building it.

```
proposal-agent/           PydanticAI agent, four step endpoints
proposal-ui/              Hand-coded React UI, four screens
```

This is a **throwaway prototype in spirit, production-quality in code**. The agent code and UI code will be refactored in Phase 3, but they should be clean enough to learn from and refer back to. No shortcuts that would obscure what the runtime needs to generalise.

### Phase 3 — Platform Agent Library

**Goal:** Extract the four agent primitives from the Proposal Generator into reusable, connector-agnostic platform components.

```
platform-agents/
  ├── fetch_agent.py      Generic fetch primitive
  ├── image_agent.py      Generic image generation primitive
  ├── text_agent.py       Generic text generation + refinement primitive
  └── write_agent.py      Generic write primitive
```

The Proposal Generator app is refactored to use these primitives. If the refactor produces identical behaviour with less code, the abstraction is correct.

### Phase 4 — App Runtime

**Goal:** Replace the hand-coded Proposal Generator UI and step sequencing with a generalised runtime that generates UI and manages state from an app definition.

```
platform-runtime/
  ├── app_schema.py       App definition schema
  ├── sequencer.py        Step execution engine
  ├── state_manager.py    Inter-step state management
  └── ui_renderer/        Generates step UI from app definition
```

### Phase 5 — Marketplace

**Goal:** Allow users to discover, install, and configure apps. Allow developers to publish apps.

```
marketplace/
  ├── registry/           App definitions, versions, installs
  ├── configurator/       Per-workspace app configuration UI
  └── runner/             Triggers app runs, surfaces results
```

---

## 5. Phase 2 in Detail — Hand-Coded Proposal Generator

### 5.1 What Gets Built

**Backend — `proposal-agent/`**

Four discrete HTTP endpoints, each backed by a focused async function or thin PydanticAI agent:

```
POST /run/fetch
POST /run/generate-image
POST /run/generate-text
POST /run/write
```

These are not four separate agent processes. They are four route handlers in one FastAPI app, each calling the appropriate tool or agent primitive directly. The proposal agent from `proposal-agent-spec.md` is implemented here, split across these four endpoints.

**Frontend — `proposal-ui/`**

A React app with four screens, one per step. The UI owns all session state between steps — opportunity data, image URL, proposal draft. No server-side session.

```
Screen 1 — Fetch
  Input:  Opportunity ID
  Action: POST /run/fetch
  Output: Opportunity summary card (name, property, services, revenue)
  Gate:   "Continue to image generation" / "Skip image, go to proposal"

Screen 2 — Image Generation
  Input:  (opportunity data from Screen 1)
  Action: POST /run/generate-image
  Output: Generated after image preview
  Gate:   "Use this image" / "Regenerate" (with optional style_hint) / "Skip"

Screen 3 — Proposal Text
  Input:  (opportunity data, image URL if generated)
  Action: POST /run/generate-text
  Output: Proposal draft in editable text area
  Gate:   "Approve and write to Aspire" / "Regenerate"
            + freeform "Notes for regeneration" input

Screen 4 — Confirmation
  Input:  (approved proposal text, image URL)
  Action: POST /run/write
  Output: Success confirmation with proposal ID and Aspire deep link
  Gate:   Done
```

### 5.2 State Flow Between Screens

The UI holds this session object in memory (React state), building it up as the user progresses through steps:

```typescript
interface ProposalSession {
  // Set by user on Screen 1
  workspaceId: string;
  opportunityId: number;
  proposalTone: "professional" | "friendly" | "concise";
  generateAfterImage: boolean;

  // Populated after Screen 1
  opportunity?: OpportunityData;
  attachments?: Attachment[];

  // Populated after Screen 2 (optional)
  afterImageUrl?: string;

  // Populated after Screen 3
  proposalText?: string;

  // Populated after Screen 4
  proposalId?: number;
}
```

Each screen receives the session as props, calls its endpoint with the relevant fields, and writes the result back into the session before advancing to the next screen.

### 5.3 The Refinement Loop on Screen 3

Screen 3 is the only screen with a genuine iteration loop. The user reads the proposal draft, optionally adds notes, and can regenerate as many times as they want before approving.

```
POST /run/generate-text
{
  "workspace_id": "ws_local",
  "opportunity_id": 12345,
  "proposal_tone": "professional",
  "has_after_image": true,
  "user_notes": null,           ← null on first call
  "previous_draft": null        ← null on first call
}

→ returns { proposal_text: "..." }

User reads draft, adds note: "Make scope of work more specific"

POST /run/generate-text
{
  "workspace_id": "ws_local",
  "opportunity_id": 12345,
  "proposal_tone": "professional",
  "has_after_image": true,
  "user_notes": "Make scope of work more specific",
  "previous_draft": "...previous proposal text..."
}

→ returns { proposal_text: "...refined version..." }
```

When `previous_draft` is present, the prompt shifts from generation to refinement:

```python
def build_prompt(previous_draft: str | None, user_notes: str | None, ...) -> str:
    if previous_draft and user_notes:
        # Refinement mode
        return f"""Refine the following proposal draft based on the user's notes.

User notes: {user_notes}

Current draft:
{previous_draft}

Apply the requested changes while preserving the overall structure and tone.
Return the complete revised proposal.
"""
    else:
        # Generation mode — original prompt builder
        return build_proposal_prompt(...)
```

### 5.4 What Phase 2 Must Teach Us

The hand-coded prototype is not just a deliverable — it is a learning exercise. Before moving to Phase 3, these questions must be answerable from experience with the running prototype:

- What state does the UI actually need to hold between steps? Is the `ProposalSession` shape above correct, or did real usage reveal missing fields?
- How long does each step take? Are loading states and progress indicators sufficient, or does the UX need streaming?
- How often do users iterate on the image vs the text? Which refinement loop matters more?
- What does a failed step actually look like to the user? Is the error handling sufficient?
- What is the natural shape of a step's output as a UI component? Does an opportunity summary card, image preview, and editable text area cover it, or are there other output types?
- Does the `user_notes` freeform field on Screen 3 produce good refinements, or does it need more structure?

Answers to these questions directly inform the App Runtime schema in Phase 4.

---

## 6. Phase 3 in Detail — Platform Agent Library

### 6.1 What Gets Extracted

After Phase 2, the four step handlers in `proposal-agent/` are refactored into typed, connector-agnostic primitives in `platform-agents/`.

The key abstraction: each primitive accepts a **configuration** at construction time and a **context** at call time. The configuration is what makes it specific to an app (which connector, which action, which template). The context is what makes it specific to a run (which workspace, which input data).

```python
# Before (Phase 2) — bespoke per app
async def fetch_opportunity(opportunity_id: int, workspace_id: str):
    result = await aspire_mcp.call("aspire_fetch_opportunity", {...})
    return OpportunityData.model_validate(result)

# After (Phase 3) — generic primitive
fetch = FetchAgent(
    connector="aspire-field-management",
    action="aspire_fetch_opportunity",
    output_model=OpportunityData,
)
result = await fetch.run(
    workspace_id="ws_local",
    inputs={"opportunity_id": 12345}
)
```

### 6.2 FetchAgent

```python
@dataclass
class FetchAgent:
    connector: str        # connector_id — matches MCP server
    action: str           # MCP tool name
    output_model: type[BaseModel]
    optional: bool = False

    async def run(self, workspace_id: str, inputs: dict) -> BaseModel | None:
        """
        Call the MCP tool and return a validated output model.
        If optional=True, returns None on failure instead of raising.
        """
        ...
```

### 6.3 ImageAgent

```python
@dataclass
class ImageAgent:
    model: str            # "dalle3" | "replicate" | "fal"
    optional: bool = True # Image generation is always optional

    async def run(
        self,
        source_image_url: str,
        prompt_hint: str | None = None,
    ) -> str | None:
        """
        Generate an after image from source_image_url.
        Returns generated image URL or None on failure.
        """
        ...
```

### 6.4 TextAgent

```python
@dataclass
class TextAgent:
    template: str         # prompt template ID from platform template registry
    model: str = "claude-sonnet-4-5"
    refineable: bool = True

    async def run(
        self,
        variables: dict,
        previous_draft: str | None = None,
        user_notes: str | None = None,
    ) -> str:
        """
        Generate or refine text.
        If previous_draft + user_notes are present, runs in refinement mode.
        """
        ...
```

### 6.5 WriteAgent

```python
@dataclass
class WriteAgent:
    connector: str        # connector_id
    action: str           # MCP tool name
    optional: bool = False

    async def run(
        self,
        workspace_id: str,
        inputs: dict,
    ) -> dict:
        """
        Call the write MCP tool with the provided inputs.
        Returns the raw result dict from the connector.
        If optional=True, returns {} on failure instead of raising.
        """
        ...
```

### 6.6 Refactored Proposal Generator App

After Phase 3, the Proposal Generator app definition becomes:

```python
from platform_agents import FetchAgent, ImageAgent, TextAgent, WriteAgent

class ProposalGeneratorApp:
    name = "Proposal Generator"
    description = "Generate AI-powered proposals from Aspire opportunities"
    connector = "aspire-field-management"
    version = "1.0.0"

    steps = [
        FetchAgent(
            connector="aspire-field-management",
            action="aspire_fetch_opportunity",
            output_model=OpportunityData,
        ),
        FetchAgent(
            connector="aspire-field-management",
            action="aspire_list_attachments",
            output_model=list[Attachment],
            optional=True,
        ),
        ImageAgent(
            model="dalle3",
            optional=True,
        ),
        TextAgent(
            template="proposal_generation_v1",
            refineable=True,
        ),
        WriteAgent(
            connector="aspire-field-management",
            action="aspire_create_proposal",
        ),
        WriteAgent(
            connector="aspire-field-management",
            action="aspire_upload_attachment",
            optional=True,
        ),
    ]
```

The four hand-coded route handlers in Phase 2 are replaced by the runtime executing this definition.

---

## 7. Phase 4 in Detail — App Runtime

### 7.1 What the Runtime Does

The runtime reads an app definition like the one above and:

- Sequences the steps in order
- Identifies which steps require human approval gates (ImageAgent, TextAgent with `refineable=True`)
- Generates the UI for each step automatically
- Manages the state object between steps
- Handles optional step failures gracefully
- Surfaces errors at the right boundary

### 7.2 Step UI Generation

Each primitive type maps to a known UI component:

```
FetchAgent   → LoadingSpinner → DataSummaryCard (no user gate)
ImageAgent   → LoadingSpinner → ImagePreview + ApproveButton + RegenerateButton
TextAgent    → LoadingSpinner → EditableTextArea + ApproveButton +
                                RegenerateButton + NotesInput
WriteAgent   → ConfirmationButton → SuccessCard (with result fields)
```

The runtime renders these components in sequence. The user never sees the underlying agent primitives — they see a coherent step-by-step UI that looks the same regardless of which app they are running.

### 7.3 App Schema

```python
class StepDefinition(BaseModel):
    agent_type: Literal["fetch", "image", "text", "write"]
    config: dict                    # agent-type specific config
    optional: bool = False
    requires_approval: bool         # auto-derived from agent_type

class AppDefinition(BaseModel):
    id: str
    name: str
    description: str
    version: str
    connector: str
    steps: list[StepDefinition]
    input_schema: dict              # fields shown to user before run starts
    output_schema: dict             # fields surfaced in result card
```

### 7.4 State Manager

The runtime state manager replaces the hand-coded `ProposalSession` in the UI:

```python
class RunState(BaseModel):
    app_id: str
    workspace_id: str
    run_id: str
    current_step: int
    inputs: dict                    # user-provided inputs
    step_outputs: dict[int, dict]   # outputs keyed by step index
    status: Literal["running", "awaiting_approval", "complete", "failed"]
    error: str | None = None
```

The state manager holds this in memory per run (local), or in a lightweight store (prod). The UI no longer needs to manage session state — it reads from and writes to the run state via the runtime API.

---

## 8. Phase 5 in Detail — Marketplace

### 8.1 What the Marketplace Is

A registry of app definitions that workspace users can:

- Browse and discover by category and connector
- Install into their workspace (associates the app with their connector credentials)
- Configure (per-workspace settings like default tone, template overrides)
- Run (triggers the runtime with their workspace context)
- Share or publish (if they have built their own app)

### 8.2 App Lifecycle

```
Developer writes AppDefinition
  → publishes to marketplace registry
    → User discovers app in marketplace
      → installs into workspace
        → platform validates connector credentials exist
          → user runs app
            → runtime executes steps with workspace credentials
              → result stored in run history
```

### 8.3 What Publishing an App Requires

```python
class MarketplaceListing(BaseModel):
    app_id: str
    app_definition: AppDefinition
    publisher: str
    category: str                   # "field-service" | "finance" | etc.
    tags: list[str]
    required_connectors: list[str]  # connectors workspace must have configured
    marketplace_published: bool
    installs: int
    version_history: list[str]
```

---

## 9. Connector Expansion Path

As new connectors are needed (by new apps or new users), the pattern from the Aspire MCP Server spec is repeated:

```
1. Obtain OpenAPI spec for the target system
2. Run connector-agent to generate connector-schema.json
3. Human review of schema (especially enums and guard fields)
4. Implement MCP server from schema (or auto-generate — future milestone)
5. Register connector in platform connector registry
6. Add auth strategy to Platform Auth Service if new auth type needed
7. New connector is available to any app in the marketplace
```

The long-term vision is step 4 being fully automated — the connector-agent generates not just the schema but the MCP server implementation directly from the OpenAPI spec. The Aspire connector, built by hand in Phase 1, is the reference implementation that the generator targets.

---

## 10. What Never Changes Between Phases

These decisions are made once and carried through all phases. Revisiting them is expensive.

| Decision                                        | Rationale                                               |
| ----------------------------------------------- | ------------------------------------------------------- |
| MCP as the connector protocol                   | Stateless, standard, agent-framework agnostic           |
| Auth service as the single credential authority | Security, reuse, no credentials in connector code       |
| Typed output models on every agent primitive    | Composability, testability, runtime state management    |
| Stateless connector MCP servers                 | Serverless-compatible, horizontally scalable            |
| PydanticAI for agent primitives                 | Type safety, Anthropic-native, testable with TestModel  |
| One connector = one MCP server                  | Clean separation, independent versioning and deployment |
| Credentials injected per workspace at runtime   | Multi-tenancy, credential isolation                     |

---

## 11. What the Proposal Generator Validates

The hand-coded Proposal Generator in Phase 2 is the proof of concept for the entire platform. If it works correctly, it demonstrates:

- The auth service correctly manages Aspire tokens across multiple connector calls in a single workflow run
- The MCP server pattern correctly decouples agent code from connector code
- The step-by-step human-in-the-loop pattern works for a real user with real Aspire data
- The refinement loop on proposal text produces genuinely useful output
- The `ProposalResult` typed output model is sufficient for the UI to render the confirmation screen
- The four primitive agent types cover the full workflow without gaps

Any gap discovered here is cheap to fix. The same gap discovered in Phase 4 is expensive.

---

## 12. Open Questions — Platform Level

These are unresolved at the platform level and will be answered by experience in Phases 2 and 3:

1. **Streaming vs polling for step progress** — long-running steps (image generation, text generation) need a UX solution. Options are SSE streaming from the agent endpoint, or client-side polling with a job ID. Decision deferred to Phase 2 UI implementation.

2. **Run history and audit trail** — should every run be persisted? Who can see run history? This becomes important for the marketplace (users want to see past proposals) but is not needed for the local prototype.

3. **Template registry** — `TextAgent` references a `template` by ID. Where do templates live? For Phase 2 they are hardcoded in the agent. For Phase 3 they need a registry. Format, versioning, and per-workspace overrides are TBD.

4. **Connector auto-generation** — the long-term goal of generating MCP server code from OpenAPI specs is a significant engineering investment. The Aspire MCP server (hand-built) is the reference target. Defer until at least two connectors exist to validate the pattern.

5. **Multi-connector apps** — the Invoice Generator example above uses both Aspire and QuickBooks. The runtime needs to handle apps that depend on multiple connectors simultaneously. Not needed for Phase 2 but should not be architecturally precluded.
