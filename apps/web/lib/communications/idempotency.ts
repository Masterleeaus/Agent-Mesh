import { communicationIdempotencyKey, type CommunicationEnvelope } from "./contracts";

/**
 * Process-local replay guard for a single runtime instance.
 *
 * This is deliberately not the durable cross-instance authority. It provides
 * immediate duplicate suppression while callers migrate to a shared durable
 * idempotency store. The canonical key is company-scoped so one company can
 * never suppress another company's communication.
 */
export class CommunicationReplayGuard {
  private readonly seen = new Map<string, number>();

  constructor(private readonly ttlMs = 5 * 60_000) {}

  claim(
    message: Pick<CommunicationEnvelope, "company_id" | "channel" | "correlation_id" | "id">,
    now = Date.now(),
  ): boolean {
    const key = communicationIdempotencyKey(message);
    this.prune(now);
    const expiresAt = this.seen.get(key);
    if (expiresAt !== undefined && expiresAt > now) return false;
    this.seen.set(key, now + this.ttlMs);
    return true;
  }

  release(
    message: Pick<CommunicationEnvelope, "company_id" | "channel" | "correlation_id" | "id">,
  ): void {
    this.seen.delete(communicationIdempotencyKey(message));
  }

  private prune(now: number): void {
    for (const [key, expiresAt] of this.seen) {
      if (expiresAt <= now) this.seen.delete(key);
    }
  }
}
