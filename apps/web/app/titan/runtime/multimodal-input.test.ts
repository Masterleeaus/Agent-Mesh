import assert from "node:assert/strict";
import test from "node:test";
import { createMultimodalInput } from "./multimodal-input";

const base = {
  company_id: "company-1",
  conversation_id: "conversation-1",
  surface: "go" as const,
  kind: "camera" as const,
  input_id: "input-1",
};

test("multimodal evidence remains authority neutral and canonically scoped", () => {
  const envelope = createMultimodalInput(base);
  assert.equal(envelope.company_id, "company-1");
  assert.equal(envelope.surface, "go");
  assert.equal(envelope.authority, "evidence_only");
});

test("legacy tenant boundaries are rejected", () => {
  assert.throws(() => createMultimodalInput({ ...base, tenant_id: "legacy" } as never), /Legacy tenant authority is forbidden/);
});

test("noncanonical surfaces and missing evidence identity fail closed", () => {
  assert.throws(() => createMultimodalInput({ ...base, surface: "command" } as never), /Canonical surface is required/);
  assert.throws(() => createMultimodalInput({ ...base, input_id: "" }), /input_id is required/);
});
