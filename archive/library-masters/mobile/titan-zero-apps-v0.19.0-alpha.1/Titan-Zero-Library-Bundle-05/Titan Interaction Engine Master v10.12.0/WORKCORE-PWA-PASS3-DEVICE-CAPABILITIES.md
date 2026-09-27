# WorkCore PWA Pass 3 — Device Capabilities

Adds a progressive-enhancement device layer without moving WorkCore authority into the browser.

## Added
- Capability detection for camera, audio recording, QR/barcode detection, geolocation, wake lock, system share, app badges, launch queue and file-system access.
- Local-first voice recording through MediaRecorder with noise suppression, automatic wake lock, haptic cues and offline evidence queue integration.
- Camera-first evidence input with rear-camera hint.
- QR/barcode detection from captured images through BarcodeDetector when supported, with manual fallback messaging.
- Event-based location stamps and optional arrival coordinates; no continuous background tracking.
- Screen wake lock control for checklists, inspections and recording.
- App badge updates driven by pending WorkCore operations.
- File-handler launch intake using Launch Queue where supported.
- Manifest share target and WorkCore protocol handler declarations.
- New voice shortcut and service-worker cache version.

## Progressive enhancement boundary
Unsupported APIs remain optional. Core offline jobs, forms, evidence and synchronisation continue to work without them.
