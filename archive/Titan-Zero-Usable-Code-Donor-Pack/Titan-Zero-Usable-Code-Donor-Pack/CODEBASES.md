# Usable Code — Root Codebases

Donor codebases are kept directly under this folder. Internal folders inside a codebase are preserved because they are part of that application's architecture.

Root codebases include AI-FSM, ResQAI, FieldFlow AI, FieldOps AI, FieldServicePro, Field Services OS, FieldCraft Mobile, Cube Knowledge/RAG, WorkflowAuto, n8n VH3AI, Glint, TradePilot marketing, FieldOps marketing, and FieldCrew marketing.

Integration rules: normalize tenancy to company_id; preserve Titan Zero canonical surfaces; do not introduce Titan Code as a production dependency; and port donor capabilities into existing Titan architecture rather than creating parallel runtime stacks.
