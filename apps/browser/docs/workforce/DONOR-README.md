# Codee Managers & AI Workforce Mega Pack v1.0.0

Integration-source pack for the existing Codee Chrome extension.

## Purpose
Adds a governed specialist-manager layer above Codee's repository/coding intelligence and MCP capability runtime. Managers classify tasks, select context/tools, gather evidence, produce recommendations, request governed mutations, request verification, hand work to other managers, and prepare **initial plan drafts**.

## Hard authority boundaries
- Existing Codee deterministic plan state machine remains the only plan advancement/completion authority.
- Managers may prepare a new plan draft but may never advance, complete, skip, retry, or mutate plan state.
- Managers never write files, databases, servers, or run mutating commands directly.
- Mutations are requests to the privileged host/Titan MCP path.
- Every managed mutation requires authenticate → authorize → backup → verify backup → write/execute → verify result → audit → rollback metadata.
- This pack does **not** implement an MCP transport/runtime. It consumes the separate MCP subsystem being built for Codee.
- AI provider outputs are advisory evidence only. The future provider pack owns provider execution.

## Included
14 specialist managers, 17 workforce capabilities, 30 prompts, 34 skills, 14 profiles, workforce manifest schema, manager routing/orchestration, evidence and handoff contracts, governed mutation requests, verification requests, plan-start drafting, AI-assistance request contract, receiver adapter, tests and integration documentation.
