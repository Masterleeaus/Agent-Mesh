import type { StorageClient } from "../../../packages/storage/src/index.js";
import type { CompanyId, WorkId, WorkItem, WorkforceEvent, WorkforceStore } from "./index.js";

/** Canonical production workforce persistence over Titan's SQLite-first StorageClient. */
export class SqliteWorkforceStore implements WorkforceStore {
  constructor(private readonly storage: StorageClient) {}

  async migrate(): Promise<void> {
    await this.storage.query(`CREATE TABLE IF NOT EXISTS workforce_work_items (
      company_id TEXT NOT NULL,
      work_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      state TEXT NOT NULL,
      assignee TEXT,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (company_id, work_id)
    )`);
    await this.storage.query(`CREATE INDEX IF NOT EXISTS workforce_work_state_idx
      ON workforce_work_items(company_id, state, updated_at)`);
    await this.storage.query(`CREATE TABLE IF NOT EXISTS workforce_events (
      event_seq INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT NOT NULL,
      work_id TEXT NOT NULL,
      type TEXT NOT NULL,
      at TEXT NOT NULL,
      actor TEXT,
      payload TEXT NOT NULL
    )`);
    await this.storage.query(`CREATE INDEX IF NOT EXISTS workforce_event_work_idx
      ON workforce_events(company_id, work_id, event_seq)`);
  }

  async get(companyId: CompanyId, workId: WorkId): Promise<WorkItem | undefined> {
    const result = await this.storage.query<{ payload: string }>(
      `SELECT payload FROM workforce_work_items WHERE company_id = $1 AND work_id = $2`,
      [companyId, workId],
    );
    return result.rows[0] ? JSON.parse(result.rows[0].payload) as WorkItem : undefined;
  }

  async put(item: WorkItem): Promise<void> {
    await this.storage.query(
      `INSERT INTO workforce_work_items(company_id, work_id, payload, state, assignee, updated_at)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(company_id, work_id) DO UPDATE SET
         payload=excluded.payload, state=excluded.state, assignee=excluded.assignee, updated_at=excluded.updated_at`,
      [item.company_id, item.work_id, JSON.stringify(item), item.state, item.assignee ?? null, item.updated_at],
    );
  }

  async list(companyId: CompanyId): Promise<WorkItem[]> {
    const result = await this.storage.query<{ payload: string }>(
      `SELECT payload FROM workforce_work_items WHERE company_id = $1 ORDER BY updated_at DESC`, [companyId],
    );
    return result.rows.map(row => JSON.parse(row.payload) as WorkItem);
  }

  async appendEvent(event: WorkforceEvent): Promise<void> {
    await this.storage.query(
      `INSERT INTO workforce_events(company_id, work_id, type, at, actor, payload) VALUES($1,$2,$3,$4,$5,$6)`,
      [event.company_id, event.work_id, event.type, event.at, event.actor ?? null, JSON.stringify(event.data ?? {})],
    );
  }
}
