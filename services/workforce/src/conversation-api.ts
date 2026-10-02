import type { ServerResponse } from "node:http";
import type { ZeroWorkforceDispatchInput, ZeroWorkforceDispatchResult } from "./zero-runtime-dispatcher.js";

export type ConversationSurface = "zero" | "go" | "hub";
export type AuthenticatedConversationContext = {
  company_id: string;
  actor_id: string;
  device_id: string;
  surface: ConversationSurface;
  session_id: string;
  context_revision: string;
};

export type ConversationRequest = {
  action?: "start" | "continue" | "resume" | "cancel";
  company_id?: string;
  actor_id?: string;
  device_id?: string;
  surface?: ConversationSurface;
  session_id?: string;
  context_revision?: string;
  conversation_id: string;
  interaction_id: string;
  client_message_id: string;
  request_id: string;
  operation_id: string;
  correlation_id: string;
  trace_id: string;
  idempotency_key: string;
  text?: string;
  continuation_token?: string;
};

export type ConversationResponse = {
  accepted: true;
  schema_version: "titan.workforce.conversation.v1";
  company_id: string;
  actor_id: string;
  device_id: string;
  surface: ConversationSurface;
  session_id: string;
  context_revision: string;
  conversation_id: string;
  request_id: string;
  operation_id: string;
  correlation_id: string;
  trace_id: string;
  idempotency_key: string;
  events: ZeroWorkforceDispatchResult["events"];
  continuation_token?: string;
};

export interface ConversationHostRuntime {
  dispatch(input: ZeroWorkforceDispatchInput): Promise<ZeroWorkforceDispatchResult>;
  cancel?(input: {
    company_id: string;
    actor_id: string;
    conversation_id: string;
    continuation_token: string;
    reason: string;
  }): Promise<ZeroWorkforceDispatchResult>;
}

export interface ConversationAuth {
  resolve(input: {
    request: ConversationRequest;
    authorization: string | undefined;
  }): Promise<AuthenticatedConversationContext>;
}

const MAX_BODY_BYTES = 64 * 1024;
const MAX_TEXT_BYTES = 20 * 1024;
const MAX_RESPONSE_BYTES = 256 * 1024;
const schema_version = "titan.workforce.conversation.v1" as const;

function required(value: unknown, code: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(code);
  return normalized;
}

function bounded(value: unknown, code: string, max: number): string {
  const normalized = required(value, code);
  if (Buffer.byteLength(normalized, "utf8") > max) throw new Error(code.replace("-required", "-too-large"));
  return normalized;
}

function errorCode(error: unknown): string {
  return error instanceof Error ? error.message : "conversation-failed";
}

export function normalizeConversationRequest(input: unknown): ConversationRequest {
  if (!input || typeof input !== "object") throw new Error("conversation-request-invalid");
  const value = input as Record<string, unknown>;
  const action = value.action === undefined ? "start" : value.action;
  if (!["start", "continue", "resume", "cancel"].includes(String(action))) throw new Error("conversation-action-invalid");
  return {
    action: action as ConversationRequest["action"],
    company_id: bounded(value.company_id, "conversation-company-id-required", 256),
    actor_id: bounded(value.actor_id, "conversation-actor-id-required", 256),
    device_id: bounded(value.device_id, "conversation-device-id-required", 256),
    surface: value.surface as ConversationSurface,
    session_id: bounded(value.session_id, "conversation-session-id-required", 256),
    context_revision: bounded(value.context_revision, "conversation-context-revision-required", 256),
    conversation_id: bounded(value.conversation_id, "conversation-id-required", 256),
    interaction_id: bounded(value.interaction_id, "conversation-interaction-id-required", 256),
    client_message_id: bounded(value.client_message_id, "conversation-client-message-id-required", 256),
    request_id: bounded(value.request_id, "conversation-request-id-required", 256),
    operation_id: bounded(value.operation_id, "conversation-operation-id-required", 256),
    correlation_id: bounded(value.correlation_id, "conversation-correlation-id-required", 256),
    trace_id: bounded(value.trace_id, "conversation-trace-id-required", 256),
    idempotency_key: bounded(value.idempotency_key, "conversation-idempotency-key-required", 256),
    text: value.text === undefined ? undefined : bounded(value.text, "conversation-text-required", MAX_TEXT_BYTES),
    continuation_token: value.continuation_token === undefined ? undefined : bounded(value.continuation_token, "conversation-continuation-required", 4096),
  };
}

function assertContext(request: ConversationRequest, context: AuthenticatedConversationContext): void {
  if (!['zero', 'go', 'hub'].includes(String(request.surface))) throw new Error("conversation-surface-invalid");
  if (request.company_id !== context.company_id) throw new Error("conversation-company-mismatch");
  if (request.actor_id !== context.actor_id) throw new Error("conversation-actor-mismatch");
  if (request.device_id !== context.device_id) throw new Error("conversation-device-mismatch");
  if (request.surface !== context.surface) throw new Error("conversation-surface-mismatch");
  if (request.session_id !== context.session_id) throw new Error("conversation-session-mismatch");
  if (request.context_revision !== context.context_revision) throw new Error("conversation-context-stale");
  if (request.action !== "cancel" && !request.text && !request.continuation_token) throw new Error("conversation-input-required");
}

function toDispatch(request: ConversationRequest): ZeroWorkforceDispatchInput {
  return {
    company_id: request.company_id!,
    actor_id: request.actor_id!,
    conversation_id: request.conversation_id,
    interaction_id: request.interaction_id,
    client_message_id: request.client_message_id,
    text: request.text ?? "",
    correlation_id: request.correlation_id,
    continuation_token: request.continuation_token,
  };
}

export async function handleConversationRequest(
  request: ConversationRequest,
  auth: ConversationAuth,
  runtime: ConversationHostRuntime,
  authorization: string | undefined,
): Promise<ConversationResponse> {
  const context = await auth.resolve({ request, authorization });
  assertContext(request, context);
  const result = request.action === "cancel"
    ? await (runtime.cancel ? runtime.cancel({
        company_id: context.company_id,
        actor_id: context.actor_id,
        conversation_id: request.conversation_id,
        continuation_token: required(request.continuation_token, "conversation-continuation-required"),
        reason: "cancelled-by-client",
      }) : Promise.reject(new Error("conversation-cancellation-unavailable")))
    : await runtime.dispatch(toDispatch(request));
  return {
    accepted: true, schema_version, ...context,
    conversation_id: request.conversation_id, request_id: request.request_id,
    operation_id: request.operation_id, correlation_id: request.correlation_id,
    trace_id: request.trace_id, idempotency_key: request.idempotency_key,
    events: result.events, ...(result.continuation_token ? { continuation_token: result.continuation_token } : {}),
  };
}

export async function readConversationBody(request: AsyncIterable<Buffer | string>): Promise<ConversationRequest> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_BODY_BYTES) throw new Error("conversation-body-too-large");
    chunks.push(buffer);
  }
  try { return normalizeConversationRequest(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
  catch (error) { if (error instanceof Error && error.message.startsWith("conversation-")) throw error; throw new Error("conversation-json-invalid"); }
}

export function writeConversationResponse(response: ServerResponse, value: ConversationResponse, stream: boolean, lastEventId?: string): void {
  const resumeIndex = lastEventId ? value.events.findIndex(event => event.id === lastEventId) : -1;
  const events = lastEventId && resumeIndex >= 0 ? value.events.slice(resumeIndex + 1) : value.events;
  if (!stream) {
    const body = JSON.stringify({ ...value, events });
    if (Buffer.byteLength(body, "utf8") > MAX_RESPONSE_BYTES) { response.writeHead(500, { "content-type": "application/json" }); response.end(JSON.stringify({ error: "conversation-response-too-large" })); return; }
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }); response.end(body); return;
  }
  response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
  for (const event of events) { response.write(`id: ${event.id}\nevent: workforce\ndata: ${JSON.stringify(event)}\n\n`); }
  response.write(`event: workforce.lifecycle\ndata: ${JSON.stringify({ accepted: true, continuation_token: value.continuation_token ?? null })}\n\n`);
  response.end();
}

export function conversationHttpStatus(code: string): number {
  if (code.includes("authentication") || code.includes("authorization")) return 401;
  if (code.includes("mismatch") || code.includes("stale") || code.includes("conflict")) return 409;
  if (code.includes("too-large")) return 413;
  if (code.includes("unavailable")) return 501;
  if (code.includes("required") || code.includes("invalid")) return 400;
  return 500;
}
