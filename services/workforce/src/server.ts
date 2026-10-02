import { createServer, type Server } from "node:http";
import { createSqliteStorage } from "../../../packages/storage/src/index.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";

const configuredStoragePath = () =>
  process.env.WORKFORCE_SQLITE_PATH ?? process.env.SQLITE_PATH ?? "/app/runtime/workforce.db";

export interface WorkforceServer {
  server: Server;
  close(): Promise<void>;
}

export async function createWorkforceServer(options: { storagePath?: string } = {}): Promise<WorkforceServer> {
  const storage = createSqliteStorage(options.storagePath ?? configuredStoragePath());
  const store = new SqliteWorkforceStore(storage);

  try {
    await store.migrate();
  } catch (error) {
    await storage.close();
    throw error;
  }

  let ready = true;
  let closing: Promise<void> | undefined;
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://workforce.internal").pathname;
    if (pathname !== "/health" && pathname !== "/ready") {
      response.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }
    if (request.method !== "GET") {
      response.writeHead(405, {
        allow: "GET",
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify({ error: "method_not_allowed" }));
      return;
    }

    if (pathname === "/health") {
      const healthy = ready;
      response.writeHead(healthy ? 200 : 503, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      response.end(JSON.stringify({
        status: healthy ? "ok" : "degraded",
        service: "workforce",
        checks: { process: healthy ? "ok" : "stopping" },
      }));
      return;
    }

    let storageReady = false;
    if (ready) {
      try {
        await storage.query("SELECT COUNT(*) AS row_count FROM workforce_work_items");
        storageReady = true;
      } catch {
        // Do not expose storage errors or configuration details through a public probe.
      }
    }
    response.writeHead(storageReady ? 200 : 503, {
      "content-type": "application/json",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify({
      status: storageReady ? "ok" : "degraded",
      service: "workforce",
      checks: { storage: storageReady ? "ok" : "fail" },
    }));
  });

  return {
    server,
    close() {
      if (closing) return closing;
      ready = false;
      closing = (async () => {
        if (server.listening) {
          await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
          });
        }
        await storage.close();
      })();
      return closing;
    },
  };
}

if (process.argv[1]?.endsWith("server.ts")) {
  const port = Number(process.env.WORKFORCE_PORT ?? "3010");
  const workforce = await createWorkforceServer();
  workforce.server.listen(port, "0.0.0.0", () => console.log(`[workforce] listening on ${port}`));
  const shutdown = () => { void workforce.close().finally(() => process.exit(0)); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
