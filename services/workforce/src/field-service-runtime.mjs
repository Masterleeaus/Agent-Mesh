import { randomUUID } from 'node:crypto';
import { createProductionRuntimeBootstrap } from './production-runtime-bootstrap.ts';
import { SqliteWorkforceStore } from './sqlite-store.ts';
import { assertAuthorityDecisionAllowsExecution } from '../../../packages/runtime/authority/authority-evaluator.mjs';
import { SqliteAuthorityStore, AuthorityContextResolver, WorkerAccessResolver, SqliteWorkerAccessStore } from '../../../packages/runtime/authority/index.mjs';
import { ExecutionGateway } from '../../../packages/tools/execution-gateway.mjs';

const CAPABILITY = 'crm.work_order.complete';
const command = text => /^complete work order ([a-zA-Z0-9_-]+)$/i.exec(String(text).trim())?.[1] ?? null;
const one = async (storage, sql, params) => (await storage.query(sql, params)).rows[0] ?? null;

/** Bounded production composition, using the existing business completion owner.
 * Authority material is read, never issued here. The explicit command adapter is
 * deliberately limited; it is not a general language planner or another engine.
 */
export async function createFieldServiceRuntime({ storage, workOrders } = {}) {
  if (!storage || storage.dialect !== 'sqlite') throw new Error('zero-sqlite-storage-required');
  for (const method of ['complete', 'read']) if (typeof workOrders?.[method] !== 'function') throw new Error(`production-runtime-port-required:workOrders.${method}`);
  const authorityStore = new SqliteAuthorityStore(storage);
  const accessResolver = new WorkerAccessResolver({ store: new SqliteWorkerAccessStore(storage) });
  const workers = new SqliteWorkforceStore(storage);
  await workers.migrate();

  async function authorize(input) {
    const { company_id, actor_id, agent_id, work_id, run_id } = input;
    const work_order_id = input.input?.work_order_id;
    const row = await one(storage, 'SELECT envelope FROM authority_state WHERE company_id=$1 AND subject_type=$2 AND subject_id=$3', [company_id, 'worker_capability', `${agent_id}/${CAPABILITY}`]);
    const grant = row ? JSON.parse(row.envelope) : {};
    const worker = await workers.getWorker(company_id, agent_id);
    const business = await workOrders.read({ company_id, actor_id, work_order_id });
    const refs = [];
    for (const id of Array.isArray(grant.evidence_refs) ? grant.evidence_refs : []) {
      const proof = await one(storage, `SELECT id FROM evidence WHERE company_id=$1 AND id=$2 AND subject_type=$3 AND subject_id=$4 AND evidence_type='field_completion'`, [company_id, id, 'work_order', work_order_id]);
      if (proof) refs.push(proof.id);
    }
    const scoped = grant.actor_id === actor_id && grant.work_order_id === work_order_id && !!business && worker?.active && worker.capabilities.includes(CAPABILITY);
    const resolver = new AuthorityContextResolver({
      authorityStore,
      requirementResolver: { async resolve() { return { company_id, capability: CAPABILITY, operation: 'complete', effect: 'write', required_permissions: [CAPABILITY], required_evidence: ['field_completion'], minimum_autonomy_score: 51 }; } },
      accessResolver,
      governanceResolver: { async resolve() { return {
        policy_allows: scoped && grant.policy_allows === true,
        governance_allows: scoped && grant.governance_allows === true,
        assurance_allows: scoped && grant.assurance_allows === true,
      }; } },
      evidenceResolver: { async resolve() { return { status: refs.length ? 'satisfied' : 'missing', refs }; } },
      riskResolver: { async resolve() { return { level: grant.risk ?? 'critical', source: 'authority_state' }; } },
      connectivityResolver: { async resolve() { return { state: 'online' }; } },
    });
    const authority = await resolver.evaluate({
      company_id, agent_id, capability: CAPABILITY, authority_decision_id: randomUUID(),
      operation_id: work_id, action_id: work_order_id, surface: 'zero',
    });
    const decision = { ...authority, decision_id: authority.authority_decision_id, actor_id, run_id, work_id, work_order_id, risk: grant.risk ?? "critical",
      status: authority.decision === 'ALLOW' ? 'allowed' : authority.decision === 'APPROVAL_REQUIRED' ? 'approval_required' : 'denied' };
    await authorityStore.appendDecision(decision);
    return decision;
  }

  async function execute(input) {
    const { company_id, work_id, run_id, agent_id } = input;
    // Re-read durable authority and reevaluate its current grant at execution time.
    // Runtime/model supplied booleans are never accepted as an execution grant.
    const decision = await authorityStore.getDecision(company_id, input.decision?.decision_id);
    if (!decision) throw new Error('zero-decision-not-found');
    if (decision.run_id !== run_id || decision.work_id !== work_id || decision.worker_id !== agent_id || decision.work_order_id !== input.input?.work_order_id) throw new Error('zero-decision-binding-conflict');
    const current = await authorize({ company_id, actor_id: decision.actor_id, agent_id, run_id, work_id, input: input.input });
    if (current.status !== 'allowed') return { state: current.status === 'approval_required' ? 'WAITING_APPROVAL' : 'DENIED', failure: { code: current.decision }, decision: current };
    assertAuthorityDecisionAllowsExecution(current, { company_id, capability: CAPABILITY, operation_id: work_id, action_id: current.work_order_id, worker_id: agent_id, now: new Date().toISOString() });
    const businessInput = { company_id, actor_id: current.actor_id, work_order_id: current.work_order_id };
    const idempotency_key = JSON.stringify([CAPABILITY, current.work_order_id]);
    const toResult = evidence => ({ execution_id: evidence.execution_id, company_id, state: evidence.state, capability: CAPABILITY, evidence });
    const evidenceSink = async evidence => {
      await storage.query('INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type,provenance,payload) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [evidence.evidence_id, company_id, 'work', work_id, 'gateway_execution', JSON.stringify({ decision_id: current.decision_id, run_id, work_id, actor_id: current.actor_id, source_evidence_refs: current.evidence_refs }), JSON.stringify({ ...evidence, provenance: { actor_id: current.actor_id, source_evidence_refs: current.evidence_refs } })]);
    };
    const gateway = new ExecutionGateway({
      evidenceSink,
      idempotencyStore: {
        async get() {
          const row = await one(storage, "SELECT payload FROM evidence WHERE company_id=$1 AND evidence_type='gateway_execution' AND json_extract(payload,'$.idempotency_key')=$2 AND json_extract(payload,'$.state')='VERIFIED' ORDER BY created_at DESC LIMIT 1", [company_id, idempotency_key]);
          if (!row) return null;
          const business = await workOrders.read(businessInput);
          if (business?.status !== 'completed' || !business.completed_at) throw new Error('zero-replay-outcome-no-longer-verified');
          return toResult(JSON.parse(row.payload));
        },
        // VERIFIED evidence is the durable replay record, already committed by record().
        async set(_key, result) {
          const row = await one(storage, 'SELECT id FROM evidence WHERE company_id=$1 AND id=$2', [company_id, result.evidence.evidence_id]);
          if (!row) throw new Error('zero-execution-evidence-not-durable');
        },
      },
      providers: [{
        id: 'native-assigned-work-order', executionClass: 'native', company_id, capabilities: [CAPABILITY],
        async execute() {
          const result = await workOrders.complete(businessInput);
          if (result.kind !== 'ok') throw new Error(`work-order-${result.kind}:${result.message ?? 'completion rejected'}`);
          return { external_ref: current.work_order_id, result };
        },
        async verify() {
          const business = await workOrders.read(businessInput);
          return { verified: business?.status === 'completed' && !!business.completed_at, method: 'independent-company-scoped-business-reread', work_order_id: current.work_order_id, observed_status: business?.status ?? null };
        },
      }],
    });
    return gateway.execute({ execution_id: randomUUID(), company_id, decision_id: current.decision_id, work_id, run_id, agent_id, capability: CAPABILITY, idempotency_key,
      input: { work_order_id: current.work_order_id }, authority: { status: 'approved', expires_at: current.authority_lease?.lease_expires_at }, risk: { status: 'approved' } });
  }

  const bootstrap = await createProductionRuntimeBootstrap({ storage, ports: {
    modelRouter: { async next({ identity, messages }) {
      const lastTool = messages.findLast(m => m.role === 'tool');
      if (lastTool?.error) throw new Error(lastTool.error);
      if (lastTool) return { final: 'Work-order completion independently verified. See the persisted outcome and evidence.' };
      const id = command(messages.findLast(m => m.role === 'user')?.content);
      if (!id) return { wait: { state: 'WAITING_USER', reason: 'Use: complete work order <id>' } };
      return { tool_calls: [{ id: `${identity.run_id}:complete`, name: CAPABILITY, arguments: { work_order_id: id } }] };
    } },
    capabilities: { async resolve({ company_id, name, agent_id }) {
      const worker = await workers.getWorker(company_id, agent_id);
      return name === CAPABILITY && worker?.active && worker.capabilities.includes(name) ? { name } : null;
    } },
    contextProvider: { async load({ company_id }) { return { company_id }; } },
    authorityGateway: { authorize, execute },
  } });

  async function project({ company_id, actor_id, work_id }) {
    const work = await bootstrap.zeroDispatcher.reconcilePersistedWork({ company_id, actor_id, work_id });
    if (!work || work.origin?.actor_id !== actor_id) return null;
    const run = await bootstrap.runStore.findByWork(company_id, work_id);
    const id = run?.messages.filter(m => m.role === 'user').map(m => command(m.content)).find(Boolean);
    const business = id ? await workOrders.read({ company_id, actor_id, work_order_id: id }) : null;
    const rows = await storage.query("SELECT payload FROM evidence WHERE company_id=$1 AND evidence_type='gateway_execution' AND (subject_id=$2 OR id IN (SELECT value FROM json_each($3))) ORDER BY created_at,id", [company_id, work_id, JSON.stringify(work.evidence_refs)]);
    const evidence = rows.rows.map(row => JSON.parse(row.payload));
    const verified = evidence.some(e => e.state === 'VERIFIED' && e.verification?.verified === true && e.verification.work_order_id === id);
    return { work, run, business, evidence, outcome: verified && business?.status === 'completed' ? 'verified' : run?.state === 'FAILED' ? 'failed' : work.state.startsWith('WAITING') ? 'waiting' : 'unverified' };
  }
  return Object.freeze({ ...bootstrap, project });
}
