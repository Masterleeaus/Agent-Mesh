import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { withRole,type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { recordGovernedInspectionState } from "@/lib/work-orders/field-governed-state";
import { buildTitanFieldInspection } from "../../../../../../../../packages/titan-platform/src/field-permits";
export const dynamic="force-dynamic";
const schema=z.object({company_id:z.string().min(1),inspection_id:z.string().min(1),permit_id:z.string().min(1),inspection_date:z.string(),result:z.enum(["scheduled","passed","failed","cancelled"])});
export const POST=withRole(["owner","admin"],async(request:NextRequest,session:AuthSession)=>{
 const id=request.url.match(/\/work-orders\/([^/]+)\/inspections/)?.[1];if(!id)return NextResponse.json({error:{code:"NOT_FOUND",message:"Work order not found",traceId:session.traceId}},{status:404});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:{code:"VALIDATION_ERROR",message:"Invalid inspection state",traceId:session.traceId}},{status:400});
 try{await withPortableTransaction(async(client)=>{
  const permit=await client.query<{id:string}>(`SELECT id FROM field_permits WHERE id=$1 AND company_id=$2 AND account_id=$3 AND work_order_id=$4 FOR UPDATE`,[parsed.data.permit_id,parsed.data.company_id,session.accountId,id]);if(!permit.rows[0])throw new Error("PERMIT_NOT_FOUND");
  const provenance={source:"titan-zero-field-api",recorded_at:new Date().toISOString(),idempotency_key:`${session.traceId}:inspection:${parsed.data.inspection_id}`,trace_id:session.traceId};
  const inspection=buildTitanFieldInspection({...parsed.data,provenance});
  await recordGovernedInspectionState(client as any,{accountId:session.accountId,company_id:inspection.company_id,actorId:session.userId,traceId:session.traceId,role:session.role},{...inspection,work_order_id:id});
 });return NextResponse.json({data:{inspection_id:parsed.data.inspection_id,result:parsed.data.result}})}
 catch(e){const missing=e instanceof Error&&e.message==="PERMIT_NOT_FOUND";return NextResponse.json({error:{code:missing?"NOT_FOUND":"MUTATION_REJECTED",message:missing?"Permit not found for work order":"Inspection mutation rejected",traceId:session.traceId}},{status:missing?404:422});}
});
