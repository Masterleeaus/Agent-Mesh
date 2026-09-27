/**
 * Bounded ring buffer for CDP events (network, console). Populated by
 * src/observers/{network,console}.js in Phase 3; read by list_network_requests,
 * read_console_messages, and get_network_request.
 *
 * Design notes:
 *  - Entries carry monotonically increasing string ids that are stable across
 *    clear() — callers that hold ids can tell whether an entry has since been
 *    evicted.
 *  - list() accepts filter / offset / head_limit; signals truncation so the
 *    agent knows it should paginate.
 *  - Eviction is oldest-first. The full buffer is never copied on push.
 */
export class RingBuffer {
  constructor(capacity = 200) {
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error("RingBuffer: capacity must be a positive finite number");
    }
    this.capacity = capacity;
    this.items = [];
    this.nextId = 1;
  }

  push(event) {
    const entry = { ...event, id: String(this.nextId++) };
    this.items.push(entry);
    if (this.items.length > this.capacity) this.items.shift();
    return entry;
  }

  list({ head_limit, offset = 0, filter } = {}) {
    let items = this.items;
    if (typeof filter === "function") items = items.filter(filter);
    const total = items.length;
    items = items.slice(offset);
    const truncated = head_limit != null && items.length > head_limit;
    if (truncated) items = items.slice(0, head_limit);
    return { items, total, truncated };
  }

  get(id) {
    return this.items.find((e) => e.id === id) || null;
  }

  clear() {
    this.items = [];
  }
}
