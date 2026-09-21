# Titan Code — Install Ready Build

This package is a Chrome/Chromium Manifest V3 extension build of Titan Code v2.11.9 with the current Agent Mesh Manager control-plane consolidation applied.

## Install in Chrome / Edge / Brave

1. Extract this ZIP to a permanent folder. Do not run the extension directly from inside the ZIP.
2. Open the browser extension manager:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the extracted folder that contains `manifest.json`.
6. Pin Titan Code if you want the sidebar/action available at all times.

## Upgrade an existing unpacked Titan Code installation

1. Stop active Titan Code plans before replacing files.
2. Keep a backup of the existing extension folder if you need rollback.
3. Replace the installed unpacked folder with this extracted build, preserving the folder location where practical.
4. Open the extension manager and press **Reload** on Titan Code.
5. Open Titan Code and run Diagnostics before resuming active plans.

Browser extension storage is managed by the browser profile; replacing the unpacked source folder does not intentionally clear extension storage. Do not use **Remove** unless you intend to uninstall the extension.

## Build identity

- Product: Titan Code
- Extension version: 2.11.9
- Prepared generation: G3 candidate
- Live baseline used for consolidation: Generation 2
- Live baseline SHA256: `64bf43a24d63387ffaa3e72103bc8d8a258293a8cc88ef1a4ef324ab8f0d6587`
- Live Delta Queue observed empty before packaging.

See `docs/MANAGER-CONTROL-PLANE-CONSOLIDATION.md` for the Manager changes included in this build.
