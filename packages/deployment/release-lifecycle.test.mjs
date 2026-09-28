import test from 'node:test';
import assert from 'node:assert/strict';
import { createReleaseLifecycle, transitionReleaseLifecycle } from './release-lifecycle.mjs';

const start = {
 release_id: 'release-322',
 version: '2026.09.29.1',
 artifact_digest: 'sha256:artifact',
 previous_known_good: '2026.09.28.9',
 company_id: 'co-322',
};
const step = (state, number, evidence_refs = []) => ({
 state,
 idempotency_key: `release-step-${number}`,
 evidence_refs,
 company_id: 'co-322',
});

test('release lifecycle verifies before activation and supports rollback', () => {
 let release = createReleaseLifecycle(start);
 release = transitionReleaseLifecycle(release, step('BUILT', 1));
 assert.throws(() => transitionReleaseLifecycle(release, step('ACTIVE', 2)), /build-before-switch/);
 release = transitionReleaseLifecycle(release, step('VERIFIED', 2, ['verification-proof']));
 release = transitionReleaseLifecycle(release, step('ACTIVE', 3, ['activation-proof']));
 release = transitionReleaseLifecycle(release, step('ROLLED_BACK', 4, ['rollback-proof']));
 assert.equal(release.state, 'ROLLED_BACK');
 assert.equal(release.events.length, 4);
});

test('release transitions are idempotent and conflicts fail closed', () => {
 let release = createReleaseLifecycle(start);
 release = transitionReleaseLifecycle(release, step('BUILT', 1));
 assert.equal(transitionReleaseLifecycle(release, step('BUILT', 1)), release);
 assert.throws(() => transitionReleaseLifecycle(release, step('VERIFIED', 1, ['proof'])), /idempotency-conflict/);
});

test('legacy tenancy and missing rollback evidence are rejected', () => {
 assert.throws(() => createReleaseLifecycle({...start, tenant_id: 'legacy'}), /legacy-release-boundary/);
 let release = createReleaseLifecycle({...start, previous_known_good: null});
 release = transitionReleaseLifecycle(release, step('BUILT', 1));
 release = transitionReleaseLifecycle(release, step('VERIFIED', 2, ['proof']));
 release = transitionReleaseLifecycle(release, step('ACTIVE', 3, ['proof']));
 assert.throws(() => transitionReleaseLifecycle(release, step('ROLLED_BACK', 4, ['proof'])), /previous-known-good/);
});
