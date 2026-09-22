# Titan Zero Field Services Marketing

Standalone marketing site for the **Titan Zero Field Services** vertical.

## Purpose

This site is the current master implementation for Titan Zero vertical marketing. It presents the managed Advanced Intelligence operating model, Field Services industry entry pages, privacy/local intelligence architecture, cost sovereignty, environmental systems, progressive trust and indicative investment examples.

It is a marketing surface only. It is **not** a Titan Zero runtime dependency.

## Local development

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run check
```

## Application destination

Consequential product actions route to the canonical Titan Zero Command application through `VITE_APP_URL`. If unset, the current fallback is `https://titanzero.io`.

## Public routes

The canonical public investment route is `/investment`; `/pricing` exists only as a redirect. Industry microsites live under `/industries/:industry`.

The sitemap and robots configuration must be updated when the final Field Services marketing hostname/subdomain is assigned.
