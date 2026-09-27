import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("Active uses the governed field runtime and receipt-controlled transitions", async () => {
  const active = await source("app/titan/components/role-details.tsx");

  assert.match(active, /go-field-runtime\.mjs/);
  assert.match(active, /prepareGoTransition/);
  assert.match(active, /applyGoReceipt/);
  assert.match(active, /Job details/);
  assert.match(active, /Live route/);
  assert.match(active, /\/main-graphics\/maps\/map\.svg/);
});

test("Active exposes access prevention, evidence and offline revalidation", async () => {
  const active = await source("app/titan/components/role-details.tsx");

  assert.match(active, /Access Failure Prevention Specialist/);
  assert.match(active, /Evidence/);
  assert.match(active, /Queued offline/);
  assert.match(active, /Revalidate before sync/);
  assert.match(active, /Start work/);
  assert.match(active, /Complete job/);
});

test("Go Comms provides field-safe escalation shortcuts", async () => {
  const secondary = await source("app/titan/components/role-secondary-surfaces.tsx");

  assert.match(secondary, /Access problem/);
  assert.match(secondary, /Safety hazard/);
  assert.match(secondary, /Running late/);
  assert.match(secondary, /Dispatch receives the job context automatically/);
});

test("Go Ready makes device and offline state visible", async () => {
  const secondary = await source("app/titan/components/role-secondary-surfaces.tsx");

  assert.match(secondary, /Offline queue/);
  assert.match(secondary, /Projection revision/);
  assert.match(secondary, /Pending sync/);
  assert.match(secondary, /Revalidate on reconnect/);
});

test("Go chat explains governed execution and proactive access protection", async () => {
  const chat = await source("app/titan/components/role-chat.tsx");
  const contract = await source("app/titan/runtime/surface-contract.mjs");

  assert.match(chat, /Actions are receipt-controlled/);
  assert.match(contract, /Access Failure Prevention Specialist/);
  assert.match(chat, /No external change without a receipt/);
});
