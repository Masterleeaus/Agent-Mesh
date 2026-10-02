# Workforce cockpit boundary

Inherits root and apps AGENTS.md. Mission #1050; canonical branch agent/issue-1050.
This plugin consumes the shared #1049 SDK and hosted #811 Workforce APIs.
No plugin-local business persistence, identity resolution, authority decisions,
agent execution, provider credentials or shell actions. Test fixtures are not production data.
Run `node --test apps/directadmin/workforce/tests/*.test.mjs` and package verification.
Keep the mission open until upstream integration and real DirectAdmin certification pass.
