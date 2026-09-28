import type { StorageClient } from "../../../packages/storage/src/index.js";
import type { CompanyId,WorkId,WorkItem,WorkforceEvent,WorkforceStore,WorkforceWorker,WorkforceWorkerStore,WorkerId } from "./index.js";
/** Canonical production workforce persistence over Titan's SQLite-first StorageClient. */
export class SqliteWorkforceStore implements WorkforceStore, WorkforceWorkerStore {
 constructor(private readonly storage:StorageClient){}
 async migrate(){
  await this.storage.query(`CREATE TABLE IF NOT EXISTS workforce_work_items (company_id TEXT NOT NULL, work_id TEXT NOT NULL, payload TEXT NOT NULL, state TEXT NOT NULL, assignee TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (company_id, work_id))`);
  await this.storage.query(`CREATE INDEX IF NOT EXISTS workforce_work_state_idx ON workforce_work_items(company_id,state,updated_at)`);
  await this.storage.query(`CREATE TABLE IF NOT EXISTS workforce_events (event_seq INTEGER PRIMARY KEY AUTOINCREMENT, company_id TEXT NOT NULL, work_id TEXT NOT NULL, type TEXT NOT NULL, at TEXT NOT NULL, actor TEXT, payload TEXT NOT NULL)`);
  await this.storage.query(`CREATE INDEX IF NOT EXISTS workforce_event_work_idx ON workforce_events(company_id,work_id,event_seq)`);
  await this.storage.query(`CREATE TABLE IF NOT EXISTS workforce_workers (company_id TEXT NOT NULL, worker_id TEXT NOT NULL, payload TEXT NOT NULL, kind TEXT NOT NULL, team_id TEXT, manager_id TEXT, active INTEGER NOT NULL, PRIMARY KEY (company_id, worker_id))`);
  await this.storage.query(`CREATE INDEX IF NOT EXISTS workforce_worker_team_idx ON workforce_workers(company_id,team_id,active)`);
 }
 async get(c:CompanyId,w:WorkId){const r=await this.storage.query<{payload:string}>(`SELECT payload FROM workforce_work_items WHERE company_id = $1 AND work_id = $2`,[c,w]);return r.rows[0]?JSON.parse(r.rows[0].payload) as WorkItem:undefined}
 async create(i:WorkItem){const r=await this.storage.query("INSERT INTO workforce_work_items(company_id,work_id,payload,state,assignee,updated_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(company_id,work_id) DO NOTHING",[i.company_id,i.work_id,JSON.stringify(i),i.state,i.assignee??null,i.updated_at]);return r.rowCount===1}
 async put(i:WorkItem){await this.storage.query(`INSERT INTO workforce_work_items(company_id,work_id,payload,state,assignee,updated_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(company_id,work_id) DO UPDATE SET payload=excluded.payload,state=excluded.state,assignee=excluded.assignee,updated_at=excluded.updated_at`,[i.company_id,i.work_id,JSON.stringify(i),i.state,i.assignee??null,i.updated_at])}
 async list(c:CompanyId){const r=await this.storage.query<{payload:string}>(`SELECT payload FROM workforce_work_items WHERE company_id = $1 ORDER BY updated_at DESC`,[c]);return r.rows.map(x=>JSON.parse(x.payload) as WorkItem)}
 async appendEvent(e:WorkforceEvent){await this.storage.query(`INSERT INTO workforce_events(company_id,work_id,type,at,actor,payload) VALUES($1,$2,$3,$4,$5,$6)`,[e.company_id,e.work_id,e.type,e.at,e.actor??null,JSON.stringify(e.data??{})])}
 async getWorker(c:CompanyId,w:WorkerId){const r=await this.storage.query<{payload:string}>(`SELECT payload FROM workforce_workers WHERE company_id = $1 AND worker_id = $2`,[c,w]);return r.rows[0]?JSON.parse(r.rows[0].payload) as WorkforceWorker:undefined}
 async putWorker(w:WorkforceWorker){await this.storage.query(`INSERT INTO workforce_workers(company_id,worker_id,payload,kind,team_id,manager_id,active) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(company_id,worker_id) DO UPDATE SET payload=excluded.payload,kind=excluded.kind,team_id=excluded.team_id,manager_id=excluded.manager_id,active=excluded.active`,[w.company_id,w.worker_id,JSON.stringify(w),w.kind,w.team_id??null,w.manager_id??null,w.active?1:0])}
 async listWorkers(c:CompanyId){const r=await this.storage.query<{payload:string}>(`SELECT payload FROM workforce_workers WHERE company_id = $1 ORDER BY worker_id`,[c]);return r.rows.map(x=>JSON.parse(x.payload) as WorkforceWorker)}
}
