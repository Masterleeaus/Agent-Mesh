import type { DbClient } from "@/lib/db-contract";
import { appendAuditLog } from "@/lib/db/audit";
import { syncDefectCompletionBlockers, syncInspectionCompletionBlockers, syncPermitCompletionBlockers } from "./field-completion-blocker-projection";
import { assertFieldMutationAuthority } from "./field-mutation-authority";
import type { Role } from "@ai-fsm/domain";

export async function recordGovernedPermitState(client:DbClient,ctx:{accountId:string;company_id:string;actorId:string;traceId:string;role:Role},permit:{permit_id:string;work_order_id:string;permit_type:string;state:string;expiry_date?:string|null;completion_blockers:readonly string[];provenance?:Record<string,unknown>}){
 assertFieldMutationAuthority({role:ctx.role,actor_id:ctx.actorId,kind:"permit_state",next_state:permit.state});
 const workOrderLock=await client.query(`SELECT id FROM work_orders WHERE id=$1 AND account_id=$2 FOR UPDATE`,[permit.work_order_id,ctx.accountId]);\n if(workOrderLock.rows.length!==1) throw new Error("field permit work-order boundary conflict");
 const idempotencyKey=String(permit.provenance?.idempotency_key??`${ctx.traceId}:permit:${permit.permit_id}`);
 const prior=await client.query<{id:string;state:string;expiry_date:string|null}>(`SELECT id,state,expiry_date FROM field_permits WHERE company_id=$1 AND idempotency_key=$2 LIMIT 1 FOR UPDATE`,[ctx.company_id,idempotencyKey]);
 if(prior.rows[0] && (prior.rows[0].id!==permit.permit_id || prior.rows[0].state!==permit.state || String(prior.rows[0].expiry_date??"")!==String(permit.expiry_date??""))) throw new Error("IDEMPOTENCY_KEY_PAYLOAD_CONFLICT");
 const write=await client.query(`INSERT INTO field_permits(id,company_id,account_id,work_order_id,permit_type,state,expiry_date,provenance,idempotency_key)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
 ON CONFLICT(id) DO UPDATE SET state=EXCLUDED.state,expiry_date=EXCLUDED.expiry_date,provenance=EXCLUDED.provenance,idempotency_key=EXCLUDED.idempotency_key,updated_at=CURRENT_TIMESTAMP
 WHERE field_permits.company_id=EXCLUDED.company_id AND field_permits.account_id=EXCLUDED.account_id AND field_permits.work_order_id=EXCLUDED.work_order_id`,
 [permit.permit_id,ctx.company_id,ctx.accountId,permit.work_order_id,permit.permit_type,permit.state,permit.expiry_date??null,JSON.stringify(permit.provenance??{}),idempotencyKey ]);
 if(write.rowCount!==1) throw new Error("field permit boundary conflict");
 await syncPermitCompletionBlockers(client,ctx.accountId,{company_id:ctx.company_id,work_order_id:permit.work_order_id,permit_id:permit.permit_id,completion_blockers:permit.completion_blockers,provenance:permit.provenance});
 await appendAuditLog(client,{account_id:ctx.accountId,entity_type:"field_permit",entity_id:permit.permit_id,action:prior.rows[0]?"update":"insert",actor_id:ctx.actorId,trace_id:ctx.traceId,new_value:{company_id:ctx.company_id,work_order_id:permit.work_order_id,state:permit.state,completion_blockers:permit.completion_blockers}});
}
export async function recordGovernedInspectionState(client:DbClient,ctx:{accountId:string;company_id:string;actorId:string;traceId:string;role:Role},inspection:{inspection_id:string;permit_id:string;work_order_id:string;inspection_date:string;result:string;provenance?:Record<string,unknown>}){
 assertFieldMutationAuthority({role:ctx.role,actor_id:ctx.actorId,kind:"inspection_result",next_state:inspection.result});
 const workOrderLock=await client.query(`SELECT id FROM work_orders WHERE id=$1 AND account_id=$2 FOR UPDATE`,[inspection.work_order_id,ctx.accountId]);\n if(workOrderLock.rows.length!==1) throw new Error("field inspection work-order boundary conflict");\n const permitBoundary=await client.query(`SELECT id FROM field_permits WHERE id=$1 AND company_id=$2 AND account_id=$3 AND work_order_id=$4 FOR UPDATE`,[inspection.permit_id,ctx.company_id,ctx.accountId,inspection.work_order_id]);\n if(permitBoundary.rows.length!==1) throw new Error("field inspection permit boundary conflict");
 const idempotencyKey=String(inspection.provenance?.idempotency_key??`${ctx.traceId}:inspection:${inspection.inspection_id}`);
 const prior=await client.query<{id:string;result:string;inspection_date:string}>(`SELECT id,result,inspection_date FROM field_permit_inspections WHERE company_id=$1 AND idempotency_key=$2 LIMIT 1 FOR UPDATE`,[ctx.company_id,idempotencyKey]);
 if(prior.rows[0] && (prior.rows[0].id!==inspection.inspection_id || prior.rows[0].result!==inspection.result || String(prior.rows[0].inspection_date)!==String(inspection.inspection_date))) throw new Error("IDEMPOTENCY_KEY_PAYLOAD_CONFLICT");
 const write=await client.query(`INSERT INTO field_permit_inspections(id,company_id,account_id,permit_id,work_order_id,inspection_date,result,provenance,idempotency_key)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
 ON CONFLICT(id) DO UPDATE SET inspection_date=EXCLUDED.inspection_date,result=EXCLUDED.result,provenance=EXCLUDED.provenance,idempotency_key=EXCLUDED.idempotency_key,updated_at=CURRENT_TIMESTAMP
 WHERE field_permit_inspections.company_id=EXCLUDED.company_id AND field_permit_inspections.account_id=EXCLUDED.account_id AND field_permit_inspections.work_order_id=EXCLUDED.work_order_id`,
 [inspection.inspection_id,ctx.company_id,ctx.accountId,inspection.permit_id,inspection.work_order_id,inspection.inspection_date,inspection.result,JSON.stringify(inspection.provenance??{}),idempotencyKey ]);
 if(write.rowCount!==1) throw new Error("field inspection boundary conflict");
 await syncInspectionCompletionBlockers(client,ctx.accountId,{company_id:ctx.company_id,work_order_id:inspection.work_order_id,permit_id:inspection.permit_id,inspection_id:inspection.inspection_id,result:inspection.result,provenance:inspection.provenance});
 await appendAuditLog(client,{account_id:ctx.accountId,entity_type:"field_inspection",entity_id:inspection.inspection_id,action:prior.rows[0]?"update":"insert",actor_id:ctx.actorId,trace_id:ctx.traceId,new_value:{company_id:ctx.company_id,permit_id:inspection.permit_id,result:inspection.result}});
}
export async function recordGovernedDefectState(client:DbClient,ctx:{accountId:string;company_id:string;actorId:string;traceId:string;role:Role},defect:{defect_id:string;work_order_id:string;punch_list_id:string;severity:string;state:string;verified_by_ref?:string|null;verified_date?:string|null;defer_reason?:string|null;completion_blockers:readonly string[];provenance?:Record<string,unknown>}){
 assertFieldMutationAuthority({role:ctx.role,actor_id:ctx.actorId,kind:"defect_state",next_state:defect.state,severity:defect.severity,verified_by_ref:defect.verified_by_ref,verified_date:defect.verified_date,defer_reason:defect.defer_reason});
 const workOrderLock=await client.query(`SELECT id FROM work_orders WHERE id=$1 AND account_id=$2 FOR UPDATE`,[defect.work_order_id,ctx.accountId]);\n if(workOrderLock.rows.length!==1) throw new Error("field defect work-order boundary conflict");
 const idempotencyKey=String(defect.provenance?.idempotency_key??`${ctx.traceId}:defect:${defect.defect_id}`);
 const prior=await client.query<{id:string;state:string;severity:string;verified_by_ref:string|null;verified_date:string|null;defer_reason:string|null}>(`SELECT id,state,severity,verified_by_ref,verified_date,defer_reason FROM field_defects WHERE company_id=$1 AND idempotency_key=$2 LIMIT 1 FOR UPDATE`,[ctx.company_id,idempotencyKey]);
 if(prior.rows[0] && (prior.rows[0].id!==defect.defect_id || prior.rows[0].state!==defect.state || prior.rows[0].severity!==defect.severity || String(prior.rows[0].verified_by_ref??"")!==String(defect.verified_by_ref??"") || String(prior.rows[0].verified_date??"")!==String(defect.verified_date??"") || String(prior.rows[0].defer_reason??"")!==String(defect.defer_reason??""))) throw new Error("IDEMPOTENCY_KEY_PAYLOAD_CONFLICT");
 const write=await client.query(`INSERT INTO field_defects(id,company_id,account_id,work_order_id,punch_list_id,severity,state,verified_by_ref,verified_date,defer_reason,provenance,idempotency_key)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
 ON CONFLICT(id) DO UPDATE SET severity=EXCLUDED.severity,state=EXCLUDED.state,verified_by_ref=EXCLUDED.verified_by_ref,verified_date=EXCLUDED.verified_date,defer_reason=EXCLUDED.defer_reason,provenance=EXCLUDED.provenance,idempotency_key=EXCLUDED.idempotency_key,updated_at=CURRENT_TIMESTAMP
 WHERE field_defects.company_id=EXCLUDED.company_id AND field_defects.account_id=EXCLUDED.account_id AND field_defects.work_order_id=EXCLUDED.work_order_id`,
 [defect.defect_id,ctx.company_id,ctx.accountId,defect.work_order_id,defect.punch_list_id,defect.severity,defect.state,defect.verified_by_ref??null,defect.verified_date??null,defect.defer_reason??null,JSON.stringify(defect.provenance??{}),idempotencyKey ]);
 if(write.rowCount!==1) throw new Error("field defect boundary conflict");
 await syncDefectCompletionBlockers(client,ctx.accountId,{company_id:ctx.company_id,work_order_id:defect.work_order_id,defect_id:defect.defect_id,completion_blockers:defect.completion_blockers,provenance:defect.provenance});
 await appendAuditLog(client,{account_id:ctx.accountId,entity_type:"field_defect",entity_id:defect.defect_id,action:prior.rows[0]?"update":"insert",actor_id:ctx.actorId,trace_id:ctx.traceId,new_value:{company_id:ctx.company_id,work_order_id:defect.work_order_id,state:defect.state,completion_blockers:defect.completion_blockers}});
}
