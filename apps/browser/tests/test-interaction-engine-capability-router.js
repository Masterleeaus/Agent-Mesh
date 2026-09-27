const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = { console };
context.globalThis = context;
vm.createContext(context);
for (const rel of ['src/interaction-engine/generated/contracts.js','src/lib/capability-registry.js','src/interaction-engine/generated/capability-router.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), context, {filename: rel});
}
const router = context.TitanInteractionCapabilityRouter;
assert.equal(router.schema, 'titan-code-interaction-capability-router/v1');
assert.equal(router.authority.capability_execute, false);
assert.equal(router.authority.plan_advance, false);

const ctx = {schema:'titan-interaction/context/v1',company_id:'c1',actor_id:'a1',device_id:'d1',correlation_id:'corr1'};
const intent = (id, availability='local', risk='low') => ({schema:'titan-interaction/capability-intent/v1',capability_intent_id:`ci-${id}`,company_id:'c1',correlation_id:'corr1',capability_id:id,availability,risk});
const snapshot = {capabilities:[
  {id:'local.cap',offline_policy:'allowed'},
  {id:'deferred.cap',offline_policy:'deferred'},
  {id:'online.cap',requiresOnline:true},
  {id:'risk.cap',offline_policy:'allowed'}
]};
assert.equal(router.route(intent('local.cap'), ctx, snapshot).route, 'local');
assert.equal(router.route(intent('deferred.cap'), ctx, snapshot).route, 'deferred');
assert.equal(router.route(intent('online.cap'), ctx, snapshot).route, 'online_required');
const unknown = router.route(intent('missing.cap'), ctx, snapshot);
assert.equal(unknown.known, false);
assert.equal(unknown.route, 'unavailable');
assert.equal(unknown.executable, false);
const risky = router.route(intent('risk.cap','local','critical'), ctx, snapshot);
assert.equal(risky.route, 'local');
assert.equal(risky.approval_required, true);
assert.equal(risky.executable, false);
assert.equal(risky.authority.capability_execute, false);
assert.equal(risky.authority.plan_advance, false);
assert.equal(risky.authority.canonical_promote, false);
assert.equal(risky.network_used, false);
assert.equal(risky.provider_used, false);
assert.equal(risky.bridge_used, false);
assert.deepEqual(router.route(intent('local.cap'), ctx, snapshot), router.route(intent('local.cap'), ctx, snapshot));
assert.throws(() => router.route({...intent('local.cap'), company_id:'c2'}, ctx, snapshot), /ERR_INTERACTION_COMPANY_SCOPE_MISMATCH/);
assert.throws(() => router.route({...intent('local.cap'), correlation_id:'other'}, ctx, snapshot), /ERR_INTERACTION_CORRELATION_MISMATCH/);
assert.throws(() => router.route({...intent('local.cap'), tenant_id:'legacy'}, ctx, snapshot), /ERR_INTERACTION_LEGACY_TENANT_ALIAS_REJECTED/);
assert.throws(() => router.route(intent('local.cap'), {...ctx, tenant_company_id:'legacy'}, snapshot), /ERR_INTERACTION_LEGACY_TENANT_ALIAS_REJECTED/);
assert.throws(() => router.route(intent('local.cap'), ctx, {capabilities:Array.from({length:513},(_,i)=>({id:`c${i}`}))}), /ERR_INTERACTION_CAPABILITY_ROUTER_REGISTRY_LIMIT/);

context.CodeeCapabilityRegistry.clear();
context.CodeeCapabilityRegistry.registerCapability({id:'shared.cap',offline_policy:'deferred'});
const shared = router.route(intent('shared.cap','local'), ctx);
assert.equal(shared.source, 'shared_registry');
assert.equal(shared.route, 'deferred');
assert.equal(shared.executable, false);
console.log('INTERACTION_ENGINE_CAPABILITY_ROUTER: PASS');
