# Titan Zero Marketing Network

Titan Zero uses independently deployable vertical entry sites. Each vertical site is a complete sales entry point that can later be mapped to its own subdomain while routing product actions into the canonical Titan Zero application.

| Vertical | Entry site | Initial industry focus |
|---|---|---|
| Field Services | `marketing-nexjob` | Cleaning, landscaping, pools, pressure washing, pest control, window cleaning, property maintenance, mobile services |
| Trades & Construction | `marketing-tradepilot` | Plumbing, electrical, HVAC, roofing, building, renovations, carpentry and related trades |
| Personal Services | `marketing-trydrafted` | Salons, barbers, beauty, wellness, personal training and fitness |
| Asset Services | `marketing-fieldops` | Automotive first, expanding to vehicles, appliances, devices, machinery and equipment |
| Professional & Business Services | dedicated site pending | Accounting, consulting, agencies, recruitment, IT, marketing and advisory services |

`marketing-fieldcrew` remains available as the Cleaning-focused Field Services site/industry pack. Useful donor pages should be retained, corrected and Titan Zero branded rather than deleted merely because newer pages are added.

## Shared page system

Every vertical entry site should carry the same core Titan Zero differentiation architecture, rewritten for the vertical:

- **Fully Managed** — assessment, integration, software gap filling, workforce configuration, management, maintenance and improvement.
- **Privacy & Architecture** — privacy first, device first, private/local LLMs, private RAG, edge nodes, customer-hosted options and provider choice.
- **Cost Sovereignty** — BYO API/AI keys, local models, customer-owned compute and transparent third-party usage economics.
- **Environmental Systems** — environmental assessment, auditing, evidence, compliance and improvement workflows, with appropriately qualified environmental scientists where professional judgement or sign-off is required.
- **Compare** — explains the managed-system, locality, ownership and cost-model differences from typical software-first/bundled-AI approaches without unsupported competitor claims.
- **Industries** — vertical-specific directory linking to dedicated industry landing pages.

Each listed industry should receive its own landing page. Those pages should reuse the vertical design system but contain industry-specific pain points, workflows, workforce roles, knowledge and capabilities.

## Product architecture reflected in marketing

Titan Zero does not only sit on top of existing systems. It keeps useful systems, integrates them, and **fills genuine gaps with additional Titan Zero software and interfaces where the business needs them**. The resulting system is managed as a whole.

All product CTAs should resolve to the canonical Titan Zero application contract unless a verified vertical-specific destination is introduced. Marketing sites remain separate deployment surfaces and must never become runtime dependencies of `apps/web`.

The canonical tenant boundary remains `company_id`.
