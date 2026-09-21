# Changelog

## 2026-06-28

### Added
- 4 missing workflow functions: `create-followup-tasks`, `fetch-upcoming-appointments`, `dispatch-notifications`, `create-operations-tasks`
- `tech-suggester` agent definition
- ESLint configuration (`.eslintrc.json`)
- Node version pinning (`.nvmrc`)
- License file (`LICENSE`)
- Prettier configuration (`.prettierrc`)
- EditorConfig (`.editorconfig`)
- Contributing guide (`CONTRIBUTING.md`)
- Code of Conduct (`CODE_OF_CONDUCT.md`)
- `vitest`, `jsdom`, `tsx` development dependencies
- CRON trigger schedules for 3 workflows

### Fixed
- 191 TypeScript errors across all 5 apps (import path resolution)
- CSS property casing typos (maxwidth, fontweight, flexwrap, etc.)
- Implicit `any` types annotated in service files
- 2 failing Python tests (update-ticket-record mocking)
- `.env` added to `.gitignore`

### Changed
- Documentation reorganized into numbered directory structure (46 files moved)
- `database/docs/` renamed to `database/seeds/`
- All doc filenames standardized to kebab-case
- Review docs merged into canonical documentation files
- App ARCHITECTURE.md files archived (content consolidated in `docs/`)
- Workflow files consolidated into subdirectory structure
- `.gitignore` `dist/` pattern updated to `**/dist/`
- `infrastructure/.gitkeep` added to preserve directory
