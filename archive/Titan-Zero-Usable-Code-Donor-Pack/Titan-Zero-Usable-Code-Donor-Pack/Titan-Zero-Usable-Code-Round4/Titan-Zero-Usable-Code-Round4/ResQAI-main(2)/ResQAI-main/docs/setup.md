# ResQAI — Setup

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+ (for functions)
- A Lemma pod account with API access

## Clone & Install

```bash
git clone <repository-url>
cd ResQAI
npm install
```

This installs all dependencies for the root workspace and all 5 applications under `apps/*`.

## Environment Variables

Copy the root `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_LEMMA_POD_ID` | Your Lemma pod ID | `your_pod_id` |
| `VITE_LEMMA_API_URL` | Lemma API base URL | `https://api.lemma.ai` |
| `VITE_LEMMA_AUTH_URL` | Lemma authentication URL | `https://auth.lemma.ai` |
| `VITE_LEMMA_APP_ID` | (Optional) Lemma app ID | |
| `VITE_LEMMA_CLIENT_ID` | (Optional) Lemma client ID | |

| `VITE_LEMMA_TOKEN` | (Optional) Lemma auth token for local dev | `lemma_...` |

Each app under `apps/*` also has its own `.env.example` with the same variables. The root `.env` is the primary source.

> **Security Note:** The `.env` file is gitignored. Never commit it. Copy `.env.example` to `.env` and fill in your values. The live pod UUID and production API URLs have been removed from all tracked files — see [`docs/09_Reports/SECURITY_AUDIT.md`](09_Reports/SECURITY_AUDIT.md).

## Development

```bash
# Start the dev server (launches all apps)
npm run dev

# Start a specific app
npx tsx scripts/dev.ts support-queue
```

The dev command injects your Lemma CLI authentication token so that OAuth is not required on localhost.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build all applications |
| `npm run validate` | Type-check all applications (`tsc --noEmit`) |
| `npm run test` | Run all tests |
| `npm run clean` | Remove build artifacts |
| `npm run seed` | List seed data information |

## Production Build

```bash
npm run build
```

Each app produces a static build in its `dist/` directory, ready to be served by any static file server.

## workspace Structure

This project uses npm workspaces (`"workspaces": ["apps/*"]`). Shared dependencies (React, TypeScript, Vite) are hoisted to the root `node_modules`. Each app retains its own `package.json` for app-specific scripts and metadata.
