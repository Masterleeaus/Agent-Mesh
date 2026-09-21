# Titan Zero — usable code extraction

Source material extracted from three uploaded repositories for manual convergence into Titan Zero.

## 1. workflow-builder/
From WorkflowAuto.

Useful for:
- Titan Builder visual workflow editor
- executable workflow engine
- node/capability registry patterns
- workflow state/execution persistence
- MCP connector patterns
- credential/auth service patterns

Important adaptation:
- Remove Aspire-specific naming and nodes or convert them to adapters.
- Normalize all tenant/company boundaries to canonical `company_id` before Titan authorization/data access.
- Do not make Redis/Postgres/provider choices mandatory if Titan already provides equivalents.

## 2. knowledge-rag/
From Cube AI.

Useful for:
- Titan Knowledge Authority
- document ingestion and chunking
- embeddings/vector indexing
- RAG retrieval/generation
- PDF/document evidence and citations
- document/chat UI components
- storage/auth/validation patterns

Important adaptation:
- Convert organization/orgId boundaries to Titan canonical `company_id`.
- Treat Qdrant, OpenRouter, AWS and other providers as replaceable adapters, not architecture requirements.
- Reuse existing Titan auth/governance when stronger than source implementation.

## 3. field-mobile/
From FieldCraft React Native.

Useful for:
- Titan Go field workflows
- offline-first local repositories
- task/material/project patterns
- photo/image capture
- sync queues and reconnect synchronization
- notifications/history/profile/settings components

Important adaptation:
- Reuse functionality selectively inside Titan Go rather than replacing Titan Go navigation/UX wholesale.
- Remove source branding and hard-coded API/provider assumptions.
- Preserve Titan Go's current surface/navigation contracts.

## Marketing-site scan
No complete public marketing website was found in these three repositories.
- Cube `frontend/app/page.tsx` is an authentication redirect/loading route, not a marketing homepage.
- WorkflowAuto `workflow-ui` is a workflow-builder application, not a marketing site.
- FieldCraft is a React Native field application and contains no public marketing site.

## Excluded intentionally
- `.env` / secret-bearing files
- lockfiles and generated build output
- Android debug/signing artifacts
- `best.pt` ML model (unknown provenance/function; review separately before use)
- infrastructure that would impose provider lock-in

Before merging, review the original repositories' licensing/provenance and Titan's existing implementation to avoid duplicate or weaker subsystems.
