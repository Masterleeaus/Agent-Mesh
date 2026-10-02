import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { createSqliteStorage } from '../../packages/storage/src/index.ts';
import { completeAssignedWorkOrder } from '../../apps/web/lib/work-orders/lead-access.ts';
import { createFieldServiceRuntime } from '../../services/workforce/src/field-service-runtime.mjs';

import { SqliteAuthorityStore, SqliteWorkerAccessStore } from '../../packages/runtime/authority/index.mjs';


export const capability='crm.work_order.complete';
export const nativeFixtureSql="INSERT INTO companies(id,name) VALUES('a','A'),('b','B'); INSERT INTO users(id,company_id,email,full_name,password_hash,role) VALUES('lead','a','lead@example.invalid','Lead','fixture','tech'); INSERT INTO clients(id,company_id,name) VALUES('client','a','Client'); INSERT INTO jobs(id,company_id,client_id,title,created_by) VALUES('job','a','client','Job','lead'); INSERT INTO work_orders(id,company_id,job_id,client_id,title,status,assigned_user_id,created_by) VALUES('wo','a','job','client','Work','in_progress','lead','lead'); INSERT INTO visits(id,company_id,job_id,work_order_id,assigned_user_id,status,scheduled_start,scheduled_end,completed_at) VALUES('visit','a','job','wo','lead','completed','2026-09-28','2026-09-28','2026-09-28'); INSERT INTO work_order_tasks(id,company_id,work_order_id,label,completed,status) VALUES('task','a','wo','Completion evidence',1,'done'); INSERT INTO evidence(id,company_id,subject_type,subject_id,evidence_type) VALUES('field-proof','a','work_order','wo','field_completion');";
export async function fixture(options:any = {}) {
 const dir=mkdtempSync(join(tmpdir(),'titan-job-')); const file=join(dir,'test.db');
 const db=new Database(file);
 for(const f of readdirSync(new URL('../../db/sqlite', import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) db.exec(readFileSync(new URL('../../db/sqlite/'+f, import.meta.url),'utf8'));
 db.exec(nativeFixtureSql);
 const envelope={actor_id:'lead',work_order_id:'wo',permissions:[capability],policy_allows:true,governance_allows:true,assurance_allows:true,risk:'low',evidence_refs:['field-proof'],approval:{status:'approved',approval_id:'approval',approver_id:'lead',approval_scope:'wo',granted_at:new Date().toISOString()},autonomy_snapshot:{company_id:'a',source:'titan-autonomy',status:'verified',decision_id:'external-autonomy',capability,effective_score:60,verified_at:new Date().toISOString()}};
 db.prepare("INSERT INTO authority_state(id,company_id,subject_type,subject_id,level,envelope) VALUES('grant','a','worker_capability',?,'scoped',?)").run('manager/'+capability,JSON.stringify(envelope));
 db.close();
 let storage=createSqliteStorage(file);
 await new SqliteWorkerAccessStore(storage).append({company_id:'a',assignment_id:'access',worker_id:'manager',permissions:[capability],status:'active',granted_at:new Date().toISOString()});
 const authorityStore=new SqliteAuthorityStore(storage);
 await authorityStore.appendAutonomySnapshot(envelope.autonomy_snapshot,{worker_id:'manager'});
 await authorityStore.appendApproval({company_id:'a',...envelope.approval});
 const workOrders:any={
  async complete({company_id,actor_id,work_order_id,controlTransaction,authorityFence,signal}:any){signal?.throwIfAborted();return controlTransaction?completeAssignedWorkOrder(controlTransaction,work_order_id,company_id,actor_id,authorityFence):storage.transaction(tx=>completeAssignedWorkOrder(tx as any,work_order_id,company_id,actor_id,authorityFence));},
  async completeInControlTransaction(input:any,tx:any){return workOrders.complete({...input,controlTransaction:tx});},
  async read({company_id,actor_id,work_order_id}:any){return (await storage.query('SELECT id,status,completed_at,assigned_user_id FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3',[company_id,work_order_id,actor_id])).rows[0]??null;},
 };
 let runtime=await createFieldServiceRuntime({storage,workOrders,...options});
 await runtime.workforce.registerWorker({company_id:'a',worker_id:'manager',kind:'digital',active:true,capabilities:['work.delegate',capability]});
 const input={company_id:'a',actor_id:'lead',conversation_id:'conversation',interaction_id:'interaction',client_message_id:'message',correlation_id:'correlation',text:'complete work order wo'};
 return {file,dir,get storage(){return storage}, get runtime(){return runtime},input,envelope,workOrders,
 async peer(){const peerStorage=createSqliteStorage(file);return {storage:peerStorage,runtime:await createFieldServiceRuntime({storage:peerStorage,workOrders})};},
 async restart(){await storage.close();storage=createSqliteStorage(file);runtime=await createFieldServiceRuntime({storage,workOrders,...options});},
 async close(){await storage.close();rmSync(dir,{recursive:true,force:true});}};
}

