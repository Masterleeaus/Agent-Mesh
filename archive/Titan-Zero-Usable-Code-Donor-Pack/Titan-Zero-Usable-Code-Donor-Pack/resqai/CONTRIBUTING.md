# Contributing to ResQAI

## Getting Started

1. Clone the repository
2. Run `npm install` to install workspace dependencies
3. Copy `.env.example` to `.env` and configure your Lemma pod credentials
4. Run `npm run dev` to start all development servers

## Development Workflow

- Each app is a standalone Vite + React application in `apps/`
- Shared code lives in `packages/` (config, sdk, types, ui, utils)
- Python functions are in `functions/`
- Agent definitions are in `agents/`

## Code Quality

- TypeScript: `npm run validate` (runs `tsc --noEmit`)
- Tests: `npm test` (Vitest for frontend, pytest for Python functions)
- Lint: `npm run lint` (ESLint configuration in `.eslintrc.json`)

## Pull Request Guidelines

- Keep changes focused and atomic
- Update documentation for any public API changes
- Ensure all tests pass before submitting
- Follow the existing code style (Prettier configuration in `.prettierrc`)

## Project Structure

See `docs/architecture.md` for the full architecture overview.
