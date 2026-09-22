import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRole, type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { canonicalCompanyIdFromSession } from "@/lib/auth/company-boundary";
import { recordGovernedPermitState } from "@/lib/work-orders/field-governed-state";
import { buildTitanFieldPermit } from "@titan-zero/titan-platform/business-ops";

export const dynamic="force-dynamic";
const schema=z.object({
 permit_id:z.string().min(1),permit_type:z.enum(["building","electrical","plumbing","mechanical","fire","excavation","environmental","occupancy","other"]),
 state:z.enum(["not_applied","application_submitted","approved","active","inspection_required","inspection_passed","inspection_failed","expired","revoked"]),
 expiry_date:z.string().nullable().optional()
});
export const POST=withRole(["owner","admin"],async(request:NextRequest,session:AuthSession)=>{
 const id=request.url.match(/\/work-orders\/([^/]+)\/permits/)?.[1];if(!id)return NextResponse.json({error:{code:"NOT_FOUND",message:"Work order not found",traceId:session.traceId}},{status:404});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:{code:"VALIDATION_ERROR",message:"Invalid permit state",traceId:session.traceId}},{status:400});
 try{
  await withPortableTransaction(async(client)=>{
   const wo=await client.query(`SELECT id FROM work_orders WHERE id=$1 AND account_id=$2 FOR UPDATE`,[id,session.accountId]);if(!wo.rows[0])throw new Error("WORK_ORDER_NOT_FOUND");
   const provenance={source:"titan-zero-field-api",recorded_at:new Date().toISOString(),idempotency_key:`${session.traceId}:permit:${parsed.data.permit_id}`,trace_id:session.traceId};
   const permit=buildTitanFieldPermit({...parsed.data,company_id:canonicalCompanyIdFromSession(session.accountId),work_order_id:id,provenance});
   await recordGovernedPermitState(client as any,{accountId:session.accountId,company_id:permit.company_id,actorId:session.userId,traceId:session.traceId,role:session.role},permit);
  });
  return NextResponse.json({data:{permit_id:parsed.data.permit_id,state:parsed.data.state}});
 }catch(e){const missing=e instanceof Error&&e.message==="WORK_ORDER_NOT_FOUND";return NextResponse.json({error:{code:missing?"NOT_FOUND":"MUTATION_REJECTED",message:missing?"Work order not found":"Permit mutation rejected",traceId:session.traceId}},{status:missing?404:422});}
});
