import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createWorkforceServer } from "./server.js";

async function listen(host: Awaited<ReturnType<typeof createWorkforceServer>>): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    host.server.once("error", reject);
    host.server.listen(0, "127.0.0.1", resolve);
  });
  const address = host.server.address();
  assert.ok(address && typeof address !== "string");
  return `http://127.0.0.1:${address.port}`;
}

test("workforce readiness checks the configured durable database and survives host restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "titan-workforce-"));
  const databasePath = join(directory, "workforce.db");

  const firstHost = await createWorkforceServer({ storagePath: databasePath });
  const firstUrl = await listen(firstHost);
  try {
    const health = await fetch(`${firstUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: "ok",
      service: "workforce",
      checks: { process: "ok" },
    });

    const ready = await fetch(`${firstUrl}/ready`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), {
      status: "ok",
      service: "workforce",
      checks: { storage: "ok" },
    });

    const method = await fetch(`${firstUrl}/ready`, { method: "POST" });
    assert.equal(method.status, 405);
    assert.equal(method.headers.get("allow"), "GET");

    const missing = await fetch(`${firstUrl}/unknown`);
    assert.equal(missing.status, 404);
  } finally {
    await firstHost.close();
  }

  const database = await readFile(databasePath);
  assert.ok(database.byteLength > 0);

  const restartedHost = await createWorkforceServer({ storagePath: databasePath });
  const restartedUrl = await listen(restartedHost);
  try {
    const readyAfterRestart = await fetch(`${restartedUrl}/ready`);
    assert.equal(readyAfterRestart.status, 200);
    assert.deepEqual(await readyAfterRestart.json(), {
      status: "ok",
      service: "workforce",
      checks: { storage: "ok" },
    });
  } finally {
    await restartedHost.close();
  }
});
