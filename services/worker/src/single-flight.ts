/** Coalesce overlapping calls on a shared connection. This is process-local
 * transaction exclusion only; durable queue leases remain the delivery owner. */
export function singleFlight<T>(operation: () => Promise<T>): () => Promise<T> {
  let active: Promise<T> | undefined;
  return () => {
    if (!active) {
      const running = Promise.resolve().then(operation);
      active = running;
      const clear = () => { if (active === running) active = undefined; };
      void running.then(clear, clear);
    }
    return active;
  };
}
