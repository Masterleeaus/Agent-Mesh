# Dependency Audit Report

## Overview

5 application package.json files were reviewed. No root `package.json` exists.

## Application Dependencies

| Package | Version | Used By |
|---------|---------|---------|
| react | ^18.3.1 | All 5 apps |
| react-dom | ^18.3.1 | All 5 apps |
| @types/react | ^18.3.3 | All 5 apps |
| @types/react-dom | ^18.3.0 | All 5 apps |
| @vitejs/plugin-react | ^4.3.1 | All 5 apps |
| typescript | ^5.5.3 | All 5 apps |
| vite | ^5.4.0 | All 5 apps |

## Unique Dependencies

| App | Package | Version |
|-----|---------|---------|
| support-queue | jsdom | ^25.0.1 |
| support-queue | vitest | ^2.1.9 |

## Duplication Analysis

**7 dependencies** are declared identically across all 5 apps:

- `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `typescript`, `vite`

### Recommendation

Create a root `package.json` with npm workspaces:

```json
{
  "name": "resqai",
  "private": true,
  "workspaces": [
    "apps/*",
    "agents/*",
    "functions/*",
    "shared/*"
  ]
}
```

This would allow:

- Hoisting common dependencies to the root `node_modules`
- Running shared scripts from the root
- Consistent dependency versions across all apps
- Removing duplicate declarations from individual `package.json` files

## Scripts Summary

| App | Scripts |
|-----|---------|
| appointment-board | dev, build, preview |
| crm-tracker | dev, build, preview |
| ops-dashboard | dev, build, preview |
| resolution-center | dev, build, preview |
| support-queue | dev, build, preview, test, test:watch |

All apps use the same `vite`, `tsc && vite build`, `vite preview` pattern. `support-queue` additionally has vitest scripts.

## Lock Files

5 `package-lock.json` files exist — one per app. An npm workspace setup would consolidate these into a single lock file.
