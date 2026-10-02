import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createWorkforceServer } from "./server.js";

test("workforce host exposes truthful health and ready state backed by durable storage", async () => {
  const directory = await mkdtemp(join(tmpdir(), "titan-workforce-"));
  const databasePath = join(directory, "workforce.db");
  const previousPath = process.env.WORKFORCE_SQLITE_PATH;
  process.env.WORKFORCE_SQLITE_PATH = databasePath;

  const host = await createWorkforceServer();
  await new Promise<void>((resolve) => host.server.listen(0, "127.0.0.1", resolve));
  const address = host.server.address();
  assert.ok(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: "ok",
      service: "workforce",
      checks: { storage: "ok" },
    });

    const ready = await fetch(`${baseUrl}/ready`);
    assert.equal(ready.status, 200);
    assert.match(await ready.text(), /"service":"workforce"/);
    await host.close();

    const database = await readFile(databasePath);
    assert.ok(database.byteLength > 0);
  } finally {
    if (previousPath === undefined) delete process.env.WORKFORCE_SQLITE_PATH;
    else process.env.WORKFORCE_SQLITE_PATH = previousPath;
  }
});
