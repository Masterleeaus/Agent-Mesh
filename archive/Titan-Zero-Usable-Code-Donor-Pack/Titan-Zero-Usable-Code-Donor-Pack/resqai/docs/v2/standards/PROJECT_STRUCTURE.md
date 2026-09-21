# RESQAI V2 — Project Structure

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Monorepo Root](#1-monorepo-root)
2. [Packages](#2-packages)
3. [Applications](#3-applications)
4. [Backend Tables](#4-backend-tables)
5. [Backend Functions](#5-backend-functions)
6. [Backend Agents](#6-backend-agents)
7. [Backend Workflows](#7-backend-workflows)
8. [Documentation](#8-documentation)
9. [Testing](#9-testing)
10. [Configuration](#10-configuration)
11. [CI/CD](#11-cicd)

---

## 1. Monorepo Root

```
resqai/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # CI pipeline
│   │   ├── cd.yml                    # CD pipeline
│   │   └── lint.yml                  # Lint check
│   ├── CODEOWNERS                    # Ownership definitions
│   └── PULL_REQUEST_TEMPLATE.md      # PR template
├── .husky/
│   ├── pre-commit                    # Lint staged
│   └── commit-msg                    # Commit lint
├── apps/                             # Frontend applications
│   └── ...                           # (see section 3)
├── backend/
│   ├── tables/                       # Database migrations
│   │   └── ...
│   ├── functions/                    # Lemma functions
│   │   └── ...
│   ├── agents/                       # Lemma agents
│   │   └── ...
│   └── workflows/                    # Lemma workflows
│       └── ...
├── packages/                         # Shared packages
│   └── ...                           # (see section 2)
├── config/                           # Project configuration
│   ├── eslint.config.js
│   ├── prettier.config.js
│   ├── tsconfig.base.json
│   ├── vitest.config.ts
│   └── tailwind.config.ts
├── scripts/                          # Build/deploy scripts
│   ├── validate.sh
│   └── deploy.sh
├── docs/                             # Documentation
│   ├── v1/                           # V1 documentation (read-only)
│   └── v2/                           # V2 documentation
│       ├── architecture/             # Phase 1.x architecture docs
│       ├── implementation/           # Phase 2.0 implementation planning
│       └── standards/               # Phase 2.1 engineering standards
├── tools/                            # Internal tooling
│   ├── dependency-analyzer/
│   └── schema-generator/
├── package.json                      # Root workspace config
├── tsconfig.json                     # TypeScript config
├── .env.example                      # Environment template
├── .gitignore
├── .prettierrc
├── .eslintrc.cjs
├── README.md
├── CONTRIBUTING.md
├── AGENTS.md
└── LEMMA.md
```

### Required Files
| File | Purpose |
|------|---------|
| `package.json` | Workspace definition, scripts |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Documented environment variables |
| `.gitignore` | Ignore patterns |
| `README.md` | Project overview |
| `CONTRIBUTING.md` | Contribution guide |
| `AGENTS.md` | AI agent instructions |
| `LEMMA.md` | Lemma CLI reference |

---

## 2. Packages

```
packages/
├── resqai-types/
│   ├── src/
│   │   ├── index.ts                  # Barrel export
│   │   ├── ticket.types.ts
│   │   ├── customer.types.ts
│   │   ├── technician.types.ts
│   │   ├── appointment.types.ts
│   │   ├── billing.types.ts
│   │   ├── notification.types.ts
│   │   ├── event.types.ts
│   │   ├── agent.types.ts
│   │   ├── workflow.types.ts
│   │   ├── api.types.ts              # Request/response types
│   │   └── common.types.ts           # Shared primitives
│   ├── tests/
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
├── resqai-utils/
│   ├── src/
│   │   ├── index.ts
│   │   ├── date.ts                   # Date helpers
│   │   ├── string.ts                 # String utilities
│   │   ├── number.ts                 # Number formatting
│   │   ├── validation.ts             # Validation helpers
│   │   ├── pagination.ts             # Pagination logic
│   │   ├── sorting.ts                # Sort logic
│   │   └── filtering.ts              # Filter logic
│   ├── tests/
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
├── resqai-errors/
│   ├── src/
│   │   ├── index.ts
│   │   ├── base-error.ts             # Base error class
│   │   ├── not-found-error.ts
│   │   ├── validation-error.ts
│   │   ├── authentication-error.ts
│   │   ├── authorization-error.ts
│   │   ├── conflict-error.ts
│   │   ├── rate-limit-error.ts
│   │   ├── timeout-error.ts
│   │   └── internal-error.ts
│   ├── tests/
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
├── resqai-config/
│   ├── src/
│   │   ├── index.ts
│   │   ├── env.ts                    # Environment loader
│   │   ├── constants.ts              # Project constants
│   │   └── feature-flags.ts          # Feature flag configuration
│   ├── tests/
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
├── resqai-ui/
│   ├── src/
│   │   ├── index.ts
│   │   ├── components/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── DataTable/
│   │   │   ├── Form/
│   │   │   ├── Dialog/
│   │   │   ├── Loading/
│   │   │   ├── EmptyState/
│   │   │   ├── ErrorState/
│   │   │   ├── Badge/
│   │   │   ├── Avatar/
│   │   │   ├── SearchInput/
│   │   │   ├── Pagination/
│   │   │   └── Breadcrumb/
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useMediaQuery.ts
│   │   └── styles/
│   │       └── index.css              # Global Tailwind imports
│   ├── tests/
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
│
└── resqai-test-utils/
    ├── src/
    │   ├── index.ts
    │   ├── mock-ticket.ts
    │   ├── mock-customer.ts
    │   ├── mock-technician.ts
    │   ├── mock-appointment.ts
    │   ├── render-with-providers.tsx   # Test render wrapper
    │   └── test-utils.ts
    ├── package.json
    └── tsconfig.json
```

### Required Files Per Package
- `package.json` — Name, version, scripts, dependencies
- `tsconfig.json` — TypeScript config (extends root)
- `src/index.ts` — Barrel export file
- `tests/` — Test directory mirroring `src/`

---

## 3. Applications

### Structure

```
apps/{app-name}_v2/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                       # Entry point
│   ├── App.tsx                        # Root component with routing
│   ├── routes.tsx                     # Route definitions
│   ├── pages/
│   │   ├── TicketList/
│   │   │   ├── index.tsx              # Page component
│   │   │   ├── TicketList.test.tsx
│   │   │   └── TicketList.stories.tsx # (optional)
│   │   ├── TicketDetail/
│   │   │   └── ...
│   │   └── index.ts                   # Barrel export
│   ├── components/
│   │   ├── TicketStatusBadge/
│   │   │   ├── TicketStatusBadge.tsx
│   │   │   ├── TicketStatusBadge.test.tsx
│   │   │   └── index.ts
│   │   └── ...
│   ├── layouts/
│   │   ├── AppLayout/
│   │   │   ├── AppLayout.tsx
│   │   │   └── AppLayout.test.tsx
│   │   └── ...
│   ├── widgets/
│   │   ├── TicketSummaryWidget/
│   │   │   ├── TicketSummaryWidget.tsx
│   │   │   ├── TicketSummaryWidget.config.ts
│   │   │   └── TicketSummaryWidget.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useTickets.ts              # Data fetching hooks
│   │   ├── useCustomers.ts
│   │   └── useLocalState.ts
│   ├── stores/
│   │   ├── ticketStore.ts             # Zustand store
│   │   └── uiStore.ts
│   ├── services/
│   │   ├── ticketService.ts           # API call layer
│   │   └── customerService.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts                   # App-specific types
│   └── styles/
│       └── app.css                     # App-specific overrides
├── index.html                          # Vite entry HTML
├── vite.config.ts                      # Vite config
├── tsconfig.json                       # App TS config (extends root)
├── package.json
├── README.md
├── .env.example
└── vitest.config.ts                    # Test config
```

### Required Files Per App
| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `vite.config.ts` | Build config |
| `tsconfig.json` | TypeScript config |
| `index.html` | HTML entry |
| `src/main.tsx` | React entry |
| `src/App.tsx` | Root component |
| `src/routes.tsx` | Route definitions |
| `README.md` | App documentation |
| `.env.example` | Environment template |

### Optional Files
| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test config (uses root if absent) |
| `.storybook/` | Storybook config |
| `Dockerfile` | Container build |

---

## 4. Backend Tables

```
backend/tables/
├── migrations/
│   ├── 000_v2_foundation/             # Schema + shared enums
│   │   ├── up.sql
│   │   └── down.sql
│   ├── 001_v2_identity/               # Identity tables
│   │   ├── up.sql
│   │   └── down.sql
│   ├── 002_v2_core/                   # Core domain tables
│   │   ├── up.sql
│   │   └── down.sql
│   ├── 003_v2_operations/             # Operations tables
│   │   ├── up.sql
│   │   └── down.sql
│   ├── 004_v2_billing/                # Billing tables
│   │   ├── up.sql
│   │   └── down.sql
│   ├── 005_v2_settings/               # Settings tables
│   │   ├── up.sql
│   │   └── down.sql
│   └── 006_v2_metrics/                # Metrics tables
│       ├── up.sql
│       └── down.sql
├── seeds/
│   ├── v2_identity_seed.sql            # Seed data
│   └── v2_core_seed.sql
└── policies/
    ├── v2_identity_rls.sql             # RLS policies
    └── v2_core_rls.sql
```

### Required Per Migration
- `up.sql` — Forward migration
- `down.sql` — Rollback migration
- Both files must exist for every migration

---

## 5. Backend Functions

```
backend/functions/
├── v2_identity/
│   ├── v2_identity_det_user/
│   │   ├── v2_identity_det_user.py     # Function code
│   │   ├── v2_identity_det_user_test.py
│   │   └── openapi.json               # Auto-generated spec
│   ├── v2_identity_wri_user/
│   │   └── ...
│   └── __init__.py
├── v2_core/
│   ├── v2_core_det_ticket/
│   ├── v2_core_wri_ticket/
│   ├── v2_core_agg_ticket_metrics/
│   ├── v2_core_orc_dispatch_technician/
│   └── ...
├── v2_operations/
│   ├── v2_operations_det_work_order/
│   └── ...
├── v2_billing/
│   ├── v2_billing_det_invoice/
│   └── ...
├── v2_notification/
│   ├── v2_notification_tra_format_sms/
│   └── ...
├── v2_connectors/
│   ├── v2_twilio_connector/
│   ├── v2_sendgrid_connector/
│   ├── v2_slack_connector/
│   ├── v2_mongodb_connector/
│   ├── v2_mapbox_connector/
│   └── v2_openai_connector/
└── __init__.py
```

### Required Per Function
| File | Purpose |
|------|---------|
| `{function_name}.py` | Function implementation |
| `{function_name}_test.py` | Unit + integration tests |
| `openapi.json` | API specification (auto-generated) |

---

## 6. Backend Agents

```
backend/agents/
├── v2_system/
│   ├── v2_system_orchestrator_agent/
│   │   ├── v2_system_orchestrator_agent.py
│   │   ├── v2_system_orchestrator_agent_test.py
│   │   └── README.md
│   └── v2_knowledge_gateway_agent/
│       └── ...
├── v2_core/
│   ├── v2_ticket_agent/
│   │   ├── v2_ticket_agent.py
│   │   ├── v2_ticket_agent_test.py
│   │   ├── prompts/
│   │   │   ├── system_prompt.txt
│   │   │   └── context_rules.json
│   │   └── README.md
│   ├── v2_customer_agent/
│   ├── v2_technician_agent/
│   ├── v2_appointment_agent/
│   ├── v2_inventory_agent/
│   ├── v2_billing_agent/
│   ├── v2_notification_agent/
│   ├── v2_escalation_agent/
│   ├── v2_report_agent/
│   ├── v2_compliance_agent/
│   ├── v2_feedback_agent/
│   └── v2_dispatch_agent/
└── v2_extended/
    ├── v2_ticket_priority_agent/
    ├── v2_ticket_routing_agent/
    ├── v2_ticket_sla_agent/
    └── ... (35 extended agents)
```

### Required Per Agent
| File | Purpose |
|------|---------|
| `{agent_name}.py` | Agent implementation |
| `{agent_name}_test.py` | Tests |
| `prompts/system_prompt.txt` | System prompt |
| `prompts/context_rules.json` | Context retrieval rules |
| `README.md` | Agent documentation |

---

## 7. Backend Workflows

```
backend/workflows/
├── v2_tier0_autonomous/               # Tier 0: No human needed
│   ├── v2_core_auto_escalate_wf/
│   │   ├── v2_core_auto_escalate_wf.py
│   │   ├── v2_core_auto_escalate_wf_test.py
│   │   └── README.md
│   └── ...
├── v2_tier1_entry/                    # Tier 1: Human-initiated
│   ├── v2_core_create_ticket_wf/
│   │   └── ...
│   └── ...
├── v2_tier2_secondary/                # Tier 2: Follow-on
│   ├── v2_core_assign_technician_wf/
│   │   └── ...
│   └── ...
├── v2_tier3_execution/                # Tier 3: Execution
│   ├── v2_core_resolve_ticket_wf/
│   │   └── ...
│   └── ...
├── v2_tier4_notification/             # Tier 4: Notifications
│   ├── v2_notification_send_alert_wf/
│   │   └── ...
│   └── ...
├── v2_tier5_reporting/                # Tier 5: Reports
│   ├── v2_billing_generate_report_wf/
│   │   └── ...
│   └── ...
├── v2_tier6_maintenance/              # Tier 6: System maintenance
│   ├── v2_core_purge_old_tickets_wf/
│   │   └── ...
│   └── ...
└── v2_tier7_system/                   # Tier 7: System operations
    ├── v2_system_health_check_wf/
    │   └── ...
    └── ...
```

### Required Per Workflow
| File | Purpose |
|------|---------|
| `{workflow_name}.py` | Workflow definition |
| `{workflow_name}_test.py` | Tests |
| `README.md` | Workflow documentation |

---

## 8. Documentation

```
docs/
├── v1/                                # V1 documentation (read-only, frozen)
│   └── ...
├── v2/
│   ├── README.md                      # V2 docs index
│   ├── architecture/                  # Phase 1.x — Architecture
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── TABLE_ARCHITECTURE.md
│   │   ├── FUNCTION_ARCHITECTURE.md
│   │   ├── FUNCTION_CATALOG.md
│   │   ├── EVENT_ARCHITECTURE.md
│   │   ├── EVENT_CATALOG.md
│   │   ├── AGENT_ARCHITECTURE.md
│   │   ├── WORKFLOW_ARCHITECTURE.md
│   │   ├── APP_ARCHITECTURE.md (directory)
│   │   ├── CONNECTOR_ARCHITECTURE.md
│   │   ├── CONNECTOR_MATRIX.md
│   │   ├── SYSTEM_INTEGRATION_MATRIX.md
│   │   ├── EXECUTION_PIPELINE.md
│   │   └── DEPENDENCY_GRAPH.md
│   ├── apps/                          # Phase 1.5 — App docs
│   │   ├── APPLICATION_ARCHITECTURE.md
│   │   ├── APPLICATION_BUILD_ORDER.md
│   │   └── APP_DETAILS.md (directory)
│   ├── database/                      # Phase 1.5 — DB docs
│   │   └── TABLE_DEPENDENCY_GRAPH.md
│   ├── workflows/                     # Phase 1.5 — Workflow docs
│   │   └── WORKFLOW_BUILD_ORDER.md
│   ├── implementation/                # Phase 2.0 — Implementation plans
│   │   ├── MASTER_BUILD_BLUEPRINT.md
│   │   ├── SPRINT_PLAN.md
│   │   ├── IMPLEMENTATION_ORDER.md
│   │   ├── DEPENDENCY_TIMELINE.md
│   │   ├── MILESTONE_PLAN.md
│   │   ├── QUALITY_GATES.md
│   │   └── PROJECT_ROADMAP.md
│   └── standards/                     # Phase 2.1 — Engineering standards
│       ├── ENGINEERING_GUIDE.md
│       ├── NAMING_CONVENTIONS.md
│       ├── PROJECT_STRUCTURE.md
│       ├── CODING_STANDARDS.md
│       ├── UI_GUIDELINES.md
│       ├── BACKEND_GUIDELINES.md
│       ├── AI_GUIDELINES.md
│       ├── WORKFLOW_GUIDELINES.md
│       ├── TESTING_GUIDELINES.md
│       └── DEFINITION_OF_DONE.md
├── README.md                          # Main docs index
├── ARCHITECTURE.md                    # Architecture overview
└── GLOSSARY.md                        # Project glossary
```

---

## 9. Testing

```
# Root-level test configs
vitest.config.ts                       # Frontend test config
pytest.ini                             # Backend test config

# Package tests live alongside source
packages/*/tests/                      # Per-package tests

# App tests live alongside source
apps/*/src/**/*.test.tsx               # Per-component tests

# Backend tests live alongside functions
backend/functions/**/*_test.py         # Per-function tests
backend/agents/**/*_test.py            # Per-agent tests
backend/workflows/**/*_test.py         # Per-workflow tests

# E2E tests
e2e/
├── playwright.config.ts
├── fixtures/                          # Test fixtures
├── journeys/
│   ├── create-ticket-journey.spec.ts
│   ├── dispatch-technician-journey.spec.ts
│   └── full-lifecycle-journey.spec.ts
└── support/
    └── test-utils.ts
```

---

## 10. Configuration

```
config/
├── eslint.config.js                   # Central ESLint config
├── prettier.config.js                 # Central Prettier config
├── tsconfig.base.json                 # Base TypeScript config
├── vitest.config.ts                   # Root Vitest config
├── tailwind.config.ts                 # Global Tailwind config
├── commitlint.config.js               # Commit message lint
├── jest.config.ts                     # Root Jest config (if needed)
├── lint-staged.config.js              # Lint-staged config
└── .markdownlint.json                 # Markdown lint config
```

---

## 11. CI/CD

```
.github/
├── workflows/
│   ├── ci.yml                         # PR checks: lint, typecheck, test
│   ├── cd.yml                         # Deploy on merge to main
│   ├── lint.yml                       # Lint-only (runs in parallel)
│   ├── security-scan.yml              # Dependency security scan
│   └── e2e.yml                        # E2E test on staging deploy
├── CODEOWNERS                         # Auto-assign reviewers
├── PULL_REQUEST_TEMPLATE.md            # PR template
└── dependabot.yml                     # Dependency update schedule
```

---

> **End of PROJECT_STRUCTURE.md**
