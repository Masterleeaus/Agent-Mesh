import { createSqliteStorage } from '../../packages/storage/src/index.ts';
import { completeAssignedWorkOrder } from '../../apps/web/lib/work-orders/lead-access.ts';
import { createFieldServiceRuntime } from '../../services/workforce/src/field-service-runtime.mjs';

async function main() {
 const [file, phase, businessFile] = process.argv.slice(2);
 const storage = createSqliteStorage(file);
 if(phase==='revoke-policy') {
  process.send?.({phase:'attempting'});
  await storage.query("UPDATE authority_state SET envelope=json_set(envelope,'$.policy_allows',json('false')) WHERE company_id='a' AND id='grant'");
  process.send?.({phase:'committed'});await storage.close();return;
 }
 const businessStorage = createSqliteStorage(businessFile);
 let reads=0;
 const runtime = await createFieldServiceRuntime({ storage, timeoutMs: 60_000, workOrders: {
  async read({company_id,actor_id,work_order_id}:any) {
   if(phase==='during-reconcile' && ++reads===4){process.send?.({phase,pid:process.pid});await new Promise(()=>{});}
   return (await businessStorage.query('SELECT id,status,completed_at FROM work_orders WHERE company_id=$1 AND id=$2 AND assigned_user_id=$3',[company_id,work_order_id,actor_id])).rows[0]??null;
  },
  async complete({company_id,actor_id,work_order_id,signal,authorityFence}:any) {
   signal?.throwIfAborted();
   if (phase === 'after-effect') await businessStorage.transaction(tx=>completeAssignedWorkOrder(tx as any,work_order_id,company_id,actor_id,authorityFence));
   process.send?.({phase,pid:process.pid});
   // Deliberately die before a provider reply. Parent sends actual SIGKILL.
   await new Promise(()=>{});
  },
 }});
 await runtime[phase==='during-reconcile'?'recover':'dispatch']({company_id:'a',actor_id:'lead',conversation_id:'conversation',interaction_id:'interaction',client_message_id:'message',correlation_id:'correlation',text:'complete work order wo'});
}
main().catch(error=>{console.error(error);process.exitCode=1;});
