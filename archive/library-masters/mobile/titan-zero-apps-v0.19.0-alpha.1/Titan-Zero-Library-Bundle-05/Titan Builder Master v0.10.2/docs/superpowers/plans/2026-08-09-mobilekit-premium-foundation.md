# Titan Builder Premium Mobilekit Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the MIT-licensed Mobilekit mobile interaction system into Titan Builder as a safe declarative Premium component and page-preset layer.

**Architecture:** Preserve Titan Builder's validated Generative UI renderer and company_id persistence boundary. Mobilekit visual/interaction code is adapted into prefixed `tpm-*` assets and declarative component metadata; no raw HTML rendering or business writes are introduced. Premium page presets compose existing Builder blocks and new mobile shell metadata while TitanMobileCore retains actual PWA/offline ownership.

**Tech Stack:** PHP 8.2/Laravel 10 extension package, JSON declarative resources, framework-free browser JavaScript, CSS.

## Global Constraints

- `company_id` remains the only active tenant boundary.
- Builder authority remains `presentation-only`.
- No Mobilekit component may write operational business records directly.
- No raw unescaped template substitution.
- No Mobilekit service worker, user-agent gate, or localStorage ownership is imported.
- Existing Customer, Field and Owner surfaces remain intact.
- Mobilekit assets are published under `public/vendor/titan-builder/premium/mobilekit/`.

---

### Task 1: Premium mobile component catalogue
- [ ] Add 17 declarative premium component definitions and register/render them through the existing Generative UI registry.
- [ ] Add runtime tests proving all components are registered.

### Task 2: Premium styles and interaction runtime
- [ ] Extract/adapt Mobilekit shell, navigation, overlay, list, story, forms, chip/comment and device-state styles under `tpm-*` names.
- [ ] Add minimal safe interaction helpers only where the existing renderer cannot own the state itself.

### Task 3: Premium mobile page library
- [ ] Convert the 18 Mobilekit full pages into declarative Titan Builder page presets.
- [ ] Keep authentication/payment/business operations as intents/placeholders, never direct authority.

### Task 4: Extension lifecycle and docs
- [ ] Publish premium assets with the standard `extension` tag.
- [ ] Replace the dormant raw HTML adapter with a catalogue-only compatibility adapter.
- [ ] Bump package version and document donor provenance/license.

### Task 5: Verification
- [ ] Run PHP lint, JSON parse, standalone package/security tests and JS runtime tests.
- [ ] Rebuild PACKAGE-FILES.sha256 and create a verified v0.5.0 ZIP.
