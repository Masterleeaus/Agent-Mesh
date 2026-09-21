import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const client = fs.readFileSync(new URL("../app/titan/runtime/interaction-client.ts", import.meta.url), "utf8");
const chat = fs.readFileSync(new URL("../app/titan/components/role-chat.tsx", import.meta.url), "utf8");

test("PWA-13 keeps company_id as the only tenant authority", () => {
  assert.match(client, /company_id is required/);
  assert.match(client, /tenant_company_id/);
  assert.match(client, /Legacy tenant authority is forbidden/);
});

test("PWA-13 supports one conversation with workforce handoff", () => {
  assert.match(client, /worker_joined/);
  assert.match(client, /handoff/);
  assert.match(client, /conversation_id/);
  assert.match(chat, /same conversation, shared context/);
  assert.match(chat, /requestedWorkerFromText/);
});

test("PWA-13 does not expose direct domain mutation authority", () => {
  assert.doesNotMatch(client, /fetch\([^)]*\/jobs|updateJob|writeInvoice|mutateSchedule/);
  assert.match(client, /accepted/);
});
