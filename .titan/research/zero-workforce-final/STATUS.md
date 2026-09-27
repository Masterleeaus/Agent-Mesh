# Zero workforce integration — pass 1

Issue #691, branch `agent/691`, based on main `eb47d23e`. The web Zero shell now displays company-scoped unread attention events and today's scheduled visits rather than fabricated zeroes. The dead GET chat form was removed because it never dispatched a runtime run. Full conversational operation remains open; this pass is not certification of the canonical end-to-end path.

Changed: `apps/web/app/app/zero/page.tsx`, `apps/web/app/app/ZeroChatFirst.tsx`. No new engine, authority, or business write path was introduced.
