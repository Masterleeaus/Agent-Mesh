# Titan Zero Browser Node — Install

This folder contains the Chrome/Chromium Manifest V3 Browser Node for Titan Zero.

The extension is being converged from the private Titan Code development tool into a Titan Zero runtime surface for governed browser work, workforce execution, evidence capture and verified outcomes.

## Install in Chrome / Edge / Brave

1. Use the `apps/browser` folder from the repository, or extract a packaged Browser Node build to a permanent folder.
2. Open the browser extension manager:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Pin **Titan Zero Browser Node** if you want quick access to its side panel.

## Upgrade an existing unpacked installation

1. Avoid replacing files while a governed browser execution is actively running.
2. Keep a copy of the old unpacked folder if rollback is required.
3. Replace/update the extension source folder.
4. Open the extension manager and choose **Reload** for Titan Zero Browser Node.
5. Open the side panel and check connection/runtime health before resuming work.

Browser extension storage belongs to the browser profile. Replacing the unpacked source folder does not intentionally clear extension storage. Removing the extension may remove local extension state.

## Product boundary

Browser Node is an execution node for Titan Zero. It is not a second authority engine, second workforce, second memory system or second source of truth.

Canonical tenant identity is `company_id`. Browser actions must remain inside Titan's decision, risk, authority, execution and evidence boundaries.

See `TITAN-ZERO-BROWSER-NODE.md` for the canonical scope and convergence rules.

## Current conversion status

The runtime contains substantial proven browser, recovery and local/browser-intelligence code inherited from Titan Code. Conversion work is progressively removing development-only product surfaces and aligning the remaining runtime with Titan Zero field-service workflows, Zero/Go/Hub surfaces, Titan Trust and verified outcomes.
