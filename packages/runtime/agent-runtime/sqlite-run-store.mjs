const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

/** Durable company-scoped RunStore for TitanAgentRuntime over the canonical StorageClient. */
export class SqliteRunStore {
  constructor(storage) { if (!storage) throw new Error('runtime-storage-required'); this.storage = storage; }

  async migrate() {
    await this.storage.query(`CREATE TABLE IF NOT EXISTS agent_runs (
      company_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      state TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      work_id TEXT,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (company_id, run_id)
    )`);
    await this.storage.query(`CREATE INDEX IF NOT EXISTS agent_runs_recovery_idx ON agent_runs(company_id,state,updated_at)`);
    await this.storage.query(`CREATE INDEX IF NOT EXISTS agent_runs_conversation_idx ON agent_runs(company_id,conversation_id,updated_at)`);
  }

  async create(run) {
    await this.migrate();
    const existing = await this.get(run.company_id, run.run_id);
    if (existing) throw new Error('runtime-run-exists');
    await this.storage.query(`INSERT INTO agent_runs(company_id,run_id,state,conversation_id,agent_id,work_id,payload,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [run.company_id, run.run_id, run.state, run.conversation_id, run.agent_id, run.work_id ?? null, JSON.stringify(run), run.updated_at]);
    return this.get(run.company_id, run.run_id);
  }

  async get(company_id, run_id) {
    await this.migrate();
    const result = await this.storage.query(`SELECT payload FROM agent_runs WHERE company_id=$1 AND run_id=$2`, [company_id, run_id]);
    return result.rows[0] ? JSON.parse(result.rows[0].payload) : null;
  }

  async save(run) {
    await this.migrate();
    const result = await this.storage.query(`UPDATE agent_runs SET state=$3,conversation_id=$4,agent_id=$5,work_id=$6,payload=$7,updated_at=$8 WHERE company_id=$1 AND run_id=$2`, [run.company_id, run.run_id, run.state, run.conversation_id, run.agent_id, run.work_id ?? null, JSON.stringify(run), run.updated_at]);
    if (!result.rowCount) throw new Error('runtime-run-not-found');
    return structuredClone(run);
  }

  async recoverable(company_id) {
    await this.migrate();
    const terminal = [...TERMINAL];
    const sql = company_id
      ? `SELECT payload FROM agent_runs WHERE company_id=$1 AND state NOT IN ($2,$3,$4) ORDER BY updated_at ASC`
      : `SELECT payload FROM agent_runs WHERE state NOT IN ($1,$2,$3) ORDER BY updated_at ASC`;
    const params = company_id ? [company_id, ...terminal] : terminal;
    const result = await this.storage.query(sql, params);
    return result.rows.map(row => JSON.parse(row.payload));
  }
}
