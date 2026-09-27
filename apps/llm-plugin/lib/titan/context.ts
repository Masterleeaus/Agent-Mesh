import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { TitanActorContext } from "./contracts";

const sessionContextSchema = z.object({
  actor_id: z.string().min(1),
  company_id: z.string().min(1),
  session_ref: z.string().min(1),
  authenticated: z.literal(true),
  expires_at: z.string().datetime().optional(),
  entitlement_ref: z.string().optional(),
});

/** Resolve identity only from Titan's authenticated server-side host/session exchange. */
export async function resolveTitanContext(): Promise<TitanActorContext | null> {
  const url = process.env.TITAN_SESSION_CONTEXT_URL?.trim();
  const token = process.env.TITAN_CHATGPT_HOST_TOKEN?.trim();
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "GET",
    headers: { authorization: `Bearer ${token}`, accept: "application/json", "x-titan-surface": "chatgpt" },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const parsed = sessionContextSchema.safeParse(await response.json());
  if (!parsed.success) return null;
  if (parsed.data.expires_at && Date.parse(parsed.data.expires_at) <= Date.now()) return null;

  return {
    actor_id: parsed.data.actor_id,
    company_id: parsed.data.company_id,
    surface: "chatgpt",
    trace_id: randomUUID(),
    auth_source: "titan_authenticated_session",
    session_ref: parsed.data.session_ref,
    entitlement_ref: parsed.data.entitlement_ref,
  };
}
