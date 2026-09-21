# Titan Zero Agent Mesh

This repository is the GitHub-based **Titan Zero Agent Mesh V3**: canonical Titan Zero source, roadmap execution, agent coordination, pull-request integration and CI evidence in one durable system.

## Current state

- Canonical extracted Titan Zero Merge84 source is on `main`.
- The roadmap index contains **55 goals**.
- Goal JSON files are present for `TZ-G00` and `TZ-ROADMAP-01` through `TZ-ROADMAP-52`.
- GitHub Issues represent **568 current subgoals**, including Goals 53–54.
- `roadmap/SUBGOAL-ISSUE-MANIFEST.json` keeps roadmap subgoal IDs synchronized to GitHub Issues.
- `.github/workflows/agent-mesh-ci.yml` validates implementation PRs.
- `.github/workflows/sync-roadmap-issues.yml` recreates missing roadmap issues idempotently.

## Agent workflow

```text
Roadmap subgoal
      ↓
GitHub Issue
      ↓
claim one issue
      ↓
agent/<subgoal-id>-<short-name>
      ↓
implementation + verification
      ↓
Pull Request
      ↓
GitHub Actions / Manager review
      ↓
merge to main
      ↓
issue + roadmap compaction
```

See `AGENTS.md` and `work/README.md` before doing development work.

## Repository areas

- `app/`, `apps/`, `packages/`, `services/`, `titan-*/` — Titan Zero implementation
- `roadmap/` — roadmap index, canonical goal files and issue-sync manifest
- `work/` — Agent Mesh coordination records
- `architecture/`, `docs/` — architecture, contracts, evidence and supporting documentation
- `.github/workflows/` — CI and Agent Mesh automation

## Authority

GitHub `main` is canonical code. GitHub Issues are claimable work. Pull Requests are the integration boundary. The roadmap defines remaining work.

Older Merge84 root documentation that described the source as Dovetails FSM is retained under `docs/archive/` for provenance; it is not the Agent Mesh execution authority.
