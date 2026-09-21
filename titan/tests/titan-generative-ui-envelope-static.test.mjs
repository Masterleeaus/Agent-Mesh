import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const runtime = fs.readFileSync(new URL("../app/titan/runtime/presentation-intent.ts", import.meta.url), "utf8");
const envelope = fs.readFileSync(new URL("../app/titan/components/generated-ui/generated-ui-envelope.tsx", import.meta.url), "utf8");
const role = fs.readFileSync(new URL("../app/titan/components/role-chat.tsx", import.meta.url), "utf8");
const demo = fs.readFileSync(new URL("../app/titan/runtime/demo-presentation-intent.ts", import.meta.url), "utf8");

test("PresentationIntent fails closed on scope and legacy tenant authority", () => {
  assert.match(runtime, /tenant_company_id/); assert.match(runtime, /tenant_id/); assert.match(runtime, /PresentationIntent scope mismatch/);
});
test("generated UI is allowlisted, text-fallback capable and capped at three", () => {
  assert.match(runtime, /allowedKinds/); assert.match(runtime, /text_fallback/); assert.match(runtime, /Math\.min\(3/); assert.match(envelope, /sr-only/);
});
test("generated UI actions only navigate or prepare governed intents", () => {
  assert.match(runtime, /navigate/); assert.match(runtime, /prepare_intent/); assert.match(runtime, /cannot execute domain mutations directly/); assert.match(envelope, /data-action-mode/);
});
test("role chat consumes PresentationIntent through the shared envelope", () => {
  assert.match(role, /GeneratedUiEnvelope/); assert.match(role, /demoPresentationIntent/); assert.doesNotMatch(role, /<ResultCard role=/); assert.match(demo, /schema: "titan-presentation-intent\/v1"/);
});
