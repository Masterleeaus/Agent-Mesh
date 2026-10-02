import test from 'node:test';
import assert from 'node:assert/strict';
import { isAbsolute } from 'node:path';
import { createWorkforceDependencies } from './fixtures/workforce-readiness-smoke.mjs';

test('CI host smoke fixture stays disabled by default and never reports a provider ready', async () => {
  const prior = process.env.WORKFORCE_SMOKE_MODE;
  try {
    delete process.env.WORKFORCE_SMOKE_MODE;
    await assert.rejects(createWorkforceDependencies(), { message: 'workforce-smoke-fixture-disabled' });
    process.env.WORKFORCE_SMOKE_MODE = '1';
    const dependencies = await createWorkforceDependencies();
    assert.equal(isAbsolute(dependencies.identityStoragePath), true);
    assert.deepEqual(await dependencies.readiness({ signal: new AbortController().signal }), {
      authentication: false, authority: false, provider: false, evidence: false,
    });
    await assert.rejects(dependencies.credentialVerifier.verify('Bearer fake', { signal: new AbortController().signal }), { message: 'workforce-smoke-authentication-disabled' });
    await assert.rejects(dependencies.workOrders.read({ signal: new AbortController().signal }), { message: 'workforce-smoke-provider-unavailable' });
    await assert.rejects(dependencies.workOrders.complete({ signal: new AbortController().signal }), { message: 'workforce-smoke-provider-unavailable' });
  } finally {
    if (prior === undefined) delete process.env.WORKFORCE_SMOKE_MODE;
    else process.env.WORKFORCE_SMOKE_MODE = prior;
  }
});
