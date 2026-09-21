import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const roleChat = fs.readFileSync(new URL("../app/titan/components/role-chat.tsx", import.meta.url), "utf8");
const generated = fs.readFileSync(new URL("../app/titan/components/generated-ui/generated-ui-envelope.tsx", import.meta.url), "utf8");
const multimodal = fs.readFileSync(new URL("../app/titan/runtime/multimodal-input.ts", import.meta.url), "utf8");

test("worker, stream and multimodal changes are announced accessibly", () => {
  assert.match(roleChat, /aria-live="polite"/);
  assert.match(roleChat, /aria-live="assertive"/);
  assert.match(roleChat, /role="status"/);
});

test("generated cards retain text fallback and keyboard focus", () => {
  assert.match(generated, /tabIndex=\{0\}/);
  assert.match(generated, /aria-describedby/);
  assert.match(generated, /text_fallback/);
});

test("voice camera and file are evidence-only envelopes", () => {
  assert.match(multimodal, /"voice" \| "camera" \| "file"/);
  assert.match(multimodal, /authority: "evidence_only"/);
  assert.match(multimodal, /tenant_company_id/);
  assert.match(roleChat, /prepareMultimodal\("camera"\)/);
  assert.match(roleChat, /prepareMultimodal\("voice"\)/);
});
