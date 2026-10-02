import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SignJWT } from 'jose';
import { tsImport } from 'tsx/esm/api';
import {
  createIdentitySessionRegistry, createSessionCredentialService,
  createSessionCredentialVerifier, directAdminIssuer,
} from '../.test-dist/security-boundary.js';

const { createSqliteStorage } = await tsImport('@titan-zero/storage', { parentURL: import.meta.url, tsconfig: false });

test('canonical audience checks reject DA credentials; separate Workforce issuance is not session exchange', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'titan-da-workforce-'));
  const storage = createSqliteStorage(join(directory, 'identity.sqlite'));
  t.after(async () => { await storage.close(); rmSync(directory, { recursive: true, force: true }); });

  const registry = await createIdentitySessionRegistry({ storage, storage_role: 'GLOBAL_REGISTRY' });
  const provider = directAdminIssuer('https://panel.example.test');
  await registry.putActor({ actor_id: 'actor-a', status: 'active' }, null);
  await registry.putDevice({ device_id: 'device-a', actor_id: 'actor-a', status: 'active' }, null);
  for (const company_id of ['company-a', 'company-b']) {
    await registry.putCompany({ company_id, status: 'active' }, null);
    await registry.putMembership({ actor_id: 'actor-a', company_id, role: 'owner', status: 'active' }, null);
    await registry.putExternalBinding({ binding_id: `binding-${company_id}`, provider, subject: 'subject-a',
      actor_id: 'actor-a', company_id, status: 'active' }, null);
  }

  const upstream = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const directadmin = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const workforce = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const upstreamTrust = { issuer: provider, audience: 'titan-login:node-a', key_id: 'upstream-a',
    algorithm: 'EdDSA', verification_key: upstream.publicKey };
  const shared = { registry, upstream: upstreamTrust, lifetime_seconds: 120 };
  const directadminService = createSessionCredentialService({ ...shared, issuer: 'titan:node-a',
    audience: 'titan-directadmin:node-a', key_id: 'da-a', algorithm: 'EdDSA',
    verification_key: directadmin.publicKey, signing_key: directadmin.privateKey,
    directadmin: { node_id: 'node-a' } });
  const workforceService = createSessionCredentialService({ ...shared, issuer: 'titan:workforce',
    audience: 'workforce', key_id: 'workforce-a', algorithm: 'EdDSA',
    verification_key: workforce.publicKey, signing_key: workforce.privateKey });
  const workforceVerifier = createSessionCredentialVerifier({ ...shared, issuer: 'titan:workforce',
    audience: 'workforce', key_id: 'workforce-a', algorithm: 'EdDSA', verification_key: workforce.publicKey });

  const now = Math.floor(Date.now() / 1000);
  const csrfNonce = Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  async function loginAssertion(jti, bindDirectAdmin) {
    const channel = bindDirectAdmin ? {
      node_id: 'node-a', da_role: 'admin',
      csrf_sha256: Buffer.from(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(csrfNonce))).toString('base64url'),
    } : {};
    return new SignJWT({ company_id: 'company-a', device_id: 'device-a', jti, ...channel })
      .setProtectedHeader({ alg: 'EdDSA', kid: 'upstream-a', typ: 'titan-login+jwt' })
      .setIssuer(provider).setAudience('titan-login:node-a').setSubject('subject-a')
      .setIssuedAt(now).setExpirationTime(now + 120).sign(upstream.privateKey);
  }

  const directadminLogin = await loginAssertion('da-login-once', true);
  const directadminContext = { company_id: 'company-a', device_id: 'device-a' };
  const directadminCredential = await directadminService.issue(directadminLogin, directadminContext);
  await assert.rejects(workforceVerifier.authenticate(directadminCredential.credential), /authentication-denied/);

  // This is a separately authenticated upstream assertion and a different
  // canonical session. It demonstrates the current supported path, not exchange.
  const workforceLogin = await loginAssertion('separate-workforce-login-once', false);
  const workforceCredential = await workforceService.issue(workforceLogin, directadminContext);
  assert.notEqual(workforceCredential.context.session_id, directadminCredential.context.session_id);
  assert.equal((await workforceVerifier.authenticate(workforceCredential.credential)).context.audience, 'workforce');

  await directadminService.switchCompany(directadminCredential.credential, directadminContext, 'company-b');
  await assert.rejects(directadminService.authenticate(directadminCredential.credential), /authentication-denied/);
  const independentWorkforceContext = await workforceVerifier.authenticate(workforceCredential.credential);
  assert.equal(independentWorkforceContext.context.company_id, 'company-a');
});
