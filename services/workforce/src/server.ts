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

const port = Number(process.env.WORKFORCE_PORT ?? "3010");
const storagePath = process.env.WORKFORCE_SQLITE_PATH ?? process.env.SQLITE_PATH ?? "/app/runtime/workforce.db";
const conversationPath = "/v1/workforce/conversations";

export interface WorkforceServer { server: Server; close(): Promise<void>; }

export type WorkforceServerOptions = {
  conversation?: {
    auth: ConversationAuth;
    runtime: ConversationHostRuntime;
  };
};

function json(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

async function handleConversation(
  request: IncomingMessage,
  response: ServerResponse,
  options: WorkforceServerOptions,
): Promise<void> {
  if (!options.conversation) { json(response, 503, { error: "conversation-host-not-configured" }); return; }
  try {
    const body = await readConversationBody(request);
    const value = await handleConversationRequest(
      body,
      options.conversation.auth,
      options.conversation.runtime,
      typeof request.headers.authorization === "string" ? request.headers.authorization : undefined,
    );
    const stream = request.headers.accept?.includes("text/event-stream") === true;
    writeConversationResponse(response, value, stream, typeof request.headers["last-event-id"] === "string" ? request.headers["last-event-id"] : undefined);
  } catch (error) {
    const code = error instanceof Error ? error.message : "conversation-failed";
    json(response, conversationHttpStatus(code), { error: code });
  }
}

export async function createWorkforceServer(options: WorkforceServerOptions = {}): Promise<WorkforceServer> {
  const storage = createSqliteStorage(storagePath);
  const store = new SqliteWorkforceStore(storage);
  await store.migrate();
  let ready = true;
  const server = createServer((request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", "http://workforce.local");
    if (url.pathname === conversationPath && method === "POST") {
      void handleConversation(request, response, options);
      return;
    }
    if (url.pathname !== "/health" && url.pathname !== "/ready") {
      json(response, 404, { error: "not_found" });
      return;
    }
    json(response, ready ? 200 : 503, {
      status: ready ? "ok" : "degraded",
      service: "workforce",
      checks: { storage: ready ? "ok" : "fail" },
      ts: new Date().toISOString(),
    });
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
