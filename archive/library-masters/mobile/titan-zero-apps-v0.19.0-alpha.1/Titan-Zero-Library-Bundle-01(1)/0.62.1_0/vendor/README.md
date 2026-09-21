# Vendored SDK Bundles

This directory holds pinned community SDK bundles that ship as part of the
Dassi extension. They're injected into matching sites via
`chrome.userScripts.register` to power curated WebMCP packs (see
`src/background/webmcp/packs/`).

## Current bundles

| File | Source | Used by | Version | SHA-256 |
|------|--------|---------|---------|---------|
| `wa-js-4.3.0.js` | https://github.com/wppconnect-team/wa-js/releases/tag/v4.3.0 | `packs/whatsapp` | 4.3.0 | `1f6f410042ebe6676a50eaf7ace197b6c1543f937902ea739957b88740d16147` |
| `gmail-js-1.1.16.js` | composed — see below | `packs/gmail` | 1.1.16 | `1d7fbd4d38103be0c5449f4b97162805a4f4f6aed639f9324aa2df5893aafe79` |

## `gmail-js-1.1.16.js` is composed, not downloaded

The upgrade flow below does NOT apply to it. The file is four concatenated
parts, in this order (see `src/background/webmcp/packs/gmail/manifest.ts`):

1. Trusted Types default-policy shim — must come first. Gmail enforces
   `require-trusted-types-for 'script'` and jQuery 3.x writes `.innerHTML`
   during init, which throws without the shim.
2. jQuery 3.7.1 slim — required by gmail-js; self-assigns to `window.jQuery`.
3. gmail-js 1.1.16 — https://github.com/KartikTalwar/gmail.js
4. Dassi init suffix — runs `new Gmail(window.jQuery)` and stashes it on
   `globalThis.__dassiGmail`, which is what the pack's `readyCheck` looks for.

Dropping a stock gmail-js release in its place removes parts 1, 2 and 4 and
breaks the pack at injection time.

## Upgrade flow (stock bundles only)

1. Identify the new version from the SDK's release page.
2. Download to this directory, named `<sdk>-<version>.js`.
3. Capture SHA-256: `shasum -a 256 <file>`.
4. Update this table.
5. Update the pack manifest in `src/background/webmcp/packs/<pack>/manifest.ts`:
   - Bump `sdk.source` filename.
   - Bump `sdk.sha256`.
6. Run smoke test (see `pack-installer.test.ts`) — verify pack still loads.
7. Manual test on real site — load extension, open matching site, verify
   the SDK initializes (e.g. `window.WPP?.isFullReady === true` for WA-JS).
8. Commit with message `chore(vendor): upgrade <sdk> to <version>`.
