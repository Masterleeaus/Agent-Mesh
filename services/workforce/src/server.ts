import { createServer, type Server } from "node:http";
import { createSqliteStorage } from "../../../packages/storage/src/index.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";

const port = Number(process.env.WORKFORCE_PORT ?? "3010");
const storagePath = process.env.WORKFORCE_SQLITE_PATH ?? process.env.SQLITE_PATH ?? "/app/runtime/workforce.db";

export interface WorkforceServer { server: Server; close(): Promise<void>; }

export async function createWorkforceServer(): Promise<WorkforceServer> {
  const storage = createSqliteStorage(storagePath);
  const store = new SqliteWorkforceStore(storage);
  await store.migrate();
  let ready = true;
  const server = createServer((request, response) => {
    if (request.url !== "/health" && request.url !== "/ready") {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }
    response.writeHead(ready ? 200 : 503, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ status: ready ? "ok" : "degraded", service: "workforce", checks: { storage: ready ? "ok" : "fail" }, ts: new Date().toISOString() }));
  });
  return {
    server,
    async close() {
      ready = false;
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await storage.close();
    },
  };
}

if (process.argv[1]?.endsWith("server.ts")) {
  const workforce = await createWorkforceServer();
  workforce.server.listen(port, "0.0.0.0", () => console.log(`[workforce] listening on ${port}`));
  const shutdown = () => { void workforce.close().finally(() => process.exit(0)); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
