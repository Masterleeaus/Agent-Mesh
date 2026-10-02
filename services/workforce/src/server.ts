import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { createSqliteStorage } from "../../../packages/storage/src/index.js";
import { SqliteWorkforceStore } from "./sqlite-store.js";
import {
  conversationHttpStatus,
  handleConversationRequest,
  readConversationBody,
  writeConversationResponse,
  type ConversationAuth,
  type ConversationHostRuntime,
} from "./conversation-api.js";

const conversationPath = "/v1/workforce/conversations";
const configuredStoragePath = () =>
  process.env.WORKFORCE_SQLITE_PATH ?? process.env.SQLITE_PATH ?? "/app/runtime/workforce.db";

export interface WorkforceServer {
  server: Server;
  close(): Promise<void>;
}

export type WorkforceServerOptions = {
  storagePath?: string;
  conversation?: {
    auth: ConversationAuth;
    runtime: ConversationHostRuntime;
  };
};

function json(response: ServerResponse, status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): void {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(body));
}

async function handleConversation(
  request: IncomingMessage,
  response: ServerResponse,
  options: WorkforceServerOptions,
): Promise<void> {
  if (!options.conversation) {
    json(response, 503, { error: "conversation-host-not-configured" });
    return;
  }
  try {
    const body = await readConversationBody(request);
    const value = await handleConversationRequest(
      body,
      options.conversation.auth,
      options.conversation.runtime,
      typeof request.headers.authorization === "string" ? request.headers.authorization : undefined,
    );
    const stream = request.headers.accept?.includes("text/event-stream") === true;
    writeConversationResponse(
      response,
      value,
      stream,
      typeof request.headers["last-event-id"] === "string" ? request.headers["last-event-id"] : undefined,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "conversation-failed";
    json(response, conversationHttpStatus(code), { error: code });
  }
}

export async function createWorkforceServer(options: WorkforceServerOptions = {}): Promise<WorkforceServer> {
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
    let pathname: string;
    try {
      pathname = new URL(request.url ?? "/", "http://workforce.internal").pathname;
    } catch {
      json(response, 400, { error: "invalid_request_target" });
      return;
    }

    if (pathname === conversationPath) {
      if (request.method !== "POST") {
        json(response, 405, { error: "method_not_allowed" }, { allow: "POST" });
        return;
      }
      await handleConversation(request, response, options);
      return;
    }

    if (pathname !== "/health" && pathname !== "/ready") {
      json(response, 404, { error: "not_found" });
      return;
    }
    if (request.method !== "GET") {
      json(response, 405, { error: "method_not_allowed" }, { allow: "GET" });
      return;
    }

    if (pathname === "/health") {
      const healthy = ready;
      json(response, healthy ? 200 : 503, {
        status: healthy ? "ok" : "degraded",
        service: "workforce",
        checks: { process: healthy ? "ok" : "stopping" },
      });
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
    json(response, storageReady ? 200 : 503, {
      status: storageReady ? "ok" : "degraded",
      service: "workforce",
      checks: { storage: storageReady ? "ok" : "fail" },
    });
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
