import type { PoolClient } from "pg";

export type FieldCompletionBlockerSource = "permit" | "inspection" | "defect";
export interface FieldCompletionBlockerProjection {
  company_id: string;
  work_order_id: string;
  source_type: FieldCompletionBlockerSource;
  source_id: string;
  reasons: readonly string[];
  provenance?: Record<string, unknown>;
}
function req(value: unknown,label:string):string{const v=String(value??"").trim();if(!v)throw new Error(`${label} is required`);return v;}
function reasons(values:readonly string[]):string[]{return [...new Set(values.map(v=>String(v??"").trim()).filter(Boolean))].sort();}

/**
 * Projection-only persistence. Callers must already hold authority to record
 * the canonical permit/inspection/defect state. This function grants none.
 */
export async function syncFieldCompletionBlockerProjection(
  client: PoolClient,
  accountId: string,
  projection: FieldCompletionBlockerProjection,
): Promise<void> {
  const companyId=req(projection.company_id,"company_id"),workOrderId=req(projection.work_order_id,"work_order_id"),sourceId=req(projection.source_id,"source_id");
  const wanted=reasons(projection.reasons);
  await client.query(
    `UPDATE field_completion_blockers
        SET blocking = FALSE, resolved_at = COALESCE(resolved_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
      WHERE company_id = $1 AND account_id = $2 AND work_order_id = $3
        AND source_type = $4 AND source_id = $5
        AND blocking = TRUE
        AND NOT (reason = ANY($6::text[]))`,
    [companyId, accountId, workOrderId, projection.source_type, sourceId, wanted],
  );
  for(const reason of wanted){
    await client.query(
      `INSERT INTO field_completion_blockers
         (company_id, account_id, work_order_id, source_type, source_id, reason, blocking, resolved_at, provenance)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,NULL,$7::jsonb)
       ON CONFLICT (company_id, work_order_id, source_type, source_id, reason)
       DO UPDATE SET blocking=TRUE,resolved_at=NULL,provenance=EXCLUDED.provenance,updated_at=CURRENT_TIMESTAMP`,
      [companyId,accountId,workOrderId,projection.source_type,sourceId,reason,JSON.stringify(projection.provenance??{})],
    );
  }
}

export async function syncPermitCompletionBlockers(
  client:PoolClient,accountId:string,
  permit:{company_id:string;work_order_id:string;permit_id:string;completion_blockers:readonly string[];provenance?:Record<string,unknown>},
):Promise<void>{
  await syncFieldCompletionBlockerProjection(client,accountId,{company_id:permit.company_id,work_order_id:permit.work_order_id,source_type:"permit",source_id:permit.permit_id,reasons:permit.completion_blockers,provenance:permit.provenance});
}

export async function syncInspectionCompletionBlockers(
  client:PoolClient,accountId:string,
  inspection:{company_id:string;work_order_id:string;inspection_id:string;result:string;provenance?:Record<string,unknown>},
):Promise<void>{
  const result=String(inspection.result).trim();
  const blockerReasons=result==="failed"?["FAILED_INSPECTION_UNRESOLVED"]:result==="scheduled"?["REQUIRED_INSPECTION_NOT_PASSED"]:[];
  await syncFieldCompletionBlockerProjection(client,accountId,{company_id:inspection.company_id,work_order_id:inspection.work_order_id,source_type:"inspection",source_id:inspection.inspection_id,reasons:blockerReasons,provenance:inspection.provenance});
}

export async function syncDefectCompletionBlockers(
  client:PoolClient,accountId:string,
  defect:{company_id:string;work_order_id:string;defect_id:string;completion_blockers:readonly string[];provenance?:Record<string,unknown>},
):Promise<void>{
  await syncFieldCompletionBlockerProjection(client,accountId,{company_id:defect.company_id,work_order_id:defect.work_order_id,source_type:"defect",source_id:defect.defect_id,reasons:defect.completion_blockers,provenance:defect.provenance});
}
