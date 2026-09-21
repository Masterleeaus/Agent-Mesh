/**
 * Pure reducer for the Built-in AI availability panel shown in the sidebar.
 *
 * Kept separate from the DOM wiring in sidebar.js so the state transitions
 * can be unit-tested without jsdom-ing the whole settings panel.
 *
 * States (see plan → Onboarding / Availability UX):
 *   unknown       — initial, before we've asked Chrome
 *   checking      — probe in flight
 *   unsupported   — no LanguageModel global OR Chrome said unavailable
 *   needs-download — downloadable / after-download
 *   downloading   — model file(s) being fetched, carries a 0..1 progress
 *   ready         — available
 *
 * Events (all plain objects, no timers):
 *   {type:"CHECK"}                          → checking
 *   {type:"PROBE_RESULT", chromeState}      → mapped via mapChromeAvailability
 *   {type:"PROBE_ERROR", detail?}           → unsupported
 *   {type:"DOWNLOAD_START"}                 → downloading (progress 0)
 *   {type:"DOWNLOAD_PROGRESS", progress}    → downloading (progress)
 *   {type:"DOWNLOAD_DONE"}                  → ready
 *   {type:"DOWNLOAD_ABORTED"}               → needs-download
 *   {type:"DOWNLOAD_ERROR", detail?}        → unsupported
 */

import { mapChromeAvailability } from "./builtin-ai-provider.js";

export const INITIAL_AVAILABILITY_STATE = { name: "unknown" };

export function availabilityReducer(state, event) {
  switch (event?.type) {
    case "CHECK":
      return { name: "checking" };
    case "PROBE_RESULT":
      return { name: mapChromeAvailability(event.chromeState) };
    case "PROBE_ERROR":
      return { name: "unsupported", detail: event.detail };
    case "DOWNLOAD_START":
      return { name: "downloading", progress: 0 };
    case "DOWNLOAD_PROGRESS":
      if (state.name !== "downloading") return state;
      return { name: "downloading", progress: clamp01(event.progress) };
    case "DOWNLOAD_DONE":
      return { name: "ready" };
    case "DOWNLOAD_ABORTED":
      return { name: "needs-download" };
    case "DOWNLOAD_ERROR":
      return { name: "unsupported", detail: event.detail };
    default:
      return state;
  }
}

function clamp01(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
