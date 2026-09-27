# Agent 4 — Findings

## Titan scan

Implementation truth is code/migrations; canonical docs follow. Existing repo contains dedicated provenance infrastructure (`packages/provenance`), offline/local packages, runtime/intelligence boundaries, and a large Titan platform package. No single clearly discoverable canonical production memory/skill package was exposed by repository code search at claim time, so this pass adds a narrow port/contract rather than inventing a second runtime or database.

## OpenAcme donor scan

OpenAcme has a concrete `@openacme/memory` package with per-agent directory persistence, bounded `MEMORY.md` index, on-demand topic files, atomic writes, path isolation, freshness warnings and memory threat scanning. It also has `@openacme/skills`: recursive `SKILL.md` discovery, registry, index/full/related progressive disclosure, search, save/delete, CLI and hub surfaces. Its license is MIT (copyright 2026 sandydasari).

Useful donor behaviours are patterns, not Titan authority. Titan requires stronger company isolation, provenance, semantic memory categories and strict separation from authority/business state.

## Critical invariants implemented

- canonical business state != memory
- memory != evidence != knowledge != decision != authority
- skill != tool != capability != authority
- every memory operation requires canonical `companyId` (API representation of `company_id`)
- inference/model output confidence is capped below direct/verified sources
- supersession cannot cross company boundaries
- expired and superseded memory is excluded from normal retrieval
- agent-private memory is not inherited by another agent
- context is bounded and relevance-ranked rather than full-history prompt dumping
- skill discovery is progressive/relevance-oriented and exposes no authority primitive

## Storage boundary

`LocalMemoryKnowledgeStore` is deliberately an in-process local-first reference adapter. Agent 1 owns canonical SQLite persistence. The stable `MemoryKnowledgePort` allows Agent 1 to replace persistence without coupling memory semantics to PostgreSQL, Redis, cloud embeddings or a model provider.

## Donor provenance

No OpenAcme source was copied verbatim in this implementation. Behavioural ideas inspected: bounded memory, freshness/consolidation pressure, safe scoped paths, progressive skill disclosure. OpenAcme license inspected and recorded as MIT.
