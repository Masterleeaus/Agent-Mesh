/** CI-only host smoke fixture. Mount this file read-only only in the VPS smoke workflow. */
export async function createWorkforceDependencies() {
  if (process.env.WORKFORCE_SMOKE_MODE !== '1') throw new Error('workforce-smoke-fixture-disabled');
  return Object.freeze({
    identityStoragePath: '/app/runtime/workforce-smoke-identity.sqlite',
    credentialVerifier: Object.freeze({
      async verify(_authorization, { signal } = {}) {
        signal?.throwIfAborted();
        throw new Error('workforce-smoke-authentication-disabled');
      },
    }),
    workOrders: Object.freeze({
      async read({ signal } = {}) {
        signal?.throwIfAborted();
        throw new Error('workforce-smoke-provider-unavailable');
      },
      async complete({ signal } = {}) {
        signal?.throwIfAborted();
        throw new Error('workforce-smoke-provider-unavailable');
      },
    }),
    async readiness({ signal } = {}) {
      signal?.throwIfAborted();
      return { authentication: false, authority: false, provider: false, evidence: false };
    },
  });
}
