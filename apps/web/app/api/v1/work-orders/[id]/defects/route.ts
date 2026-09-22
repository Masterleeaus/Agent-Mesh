import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { withRole,type AuthSession } from "@/lib/auth/middleware";
import { withPortableTransaction } from "@/lib/db/portable";
import { canonicalCompanyIdFromSession } from "@/lib/auth/company-boundary";
import { recordGovernedDefectState } from "@/lib/work-orders/field-governed-state";
import { buildTitanFieldDefect } from "@titan-zero/titan-platform/business-ops";
export const dynamic="force-dynamic";
const schema=z.object({
 defect_id:z.string().min(1),punch_list_id:z.string().min(1),description:z.string().min(1),
 category:z.enum(["cosmetic","functional","safety","incomplete","damage","code_violation","other"]),severity:z.enum(["minor","moderate","major","critical"]),
 state:z.enum(["open","assigned","in_progress","completed","verified","rejected","deferred"]),verified_date:z.string().nullable().optional(),defer_reason:z.string().nullable().optional()
});
export const POST=withRole(["owner","admin"],async(request:NextRequest,session:AuthSession)=>{
 const id=request.url.match(/\/work-orders\/([^/]+)\/defects/)?.[1];if(!id)return NextResponse.json({error:{code:"NOT_FOUND",message:"Work order not found",traceId:session.traceId}},{status:404});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:{code:"VALIDATION_ERROR",message:"Invalid defect state",traceId:session.traceId}},{status:400});
 try{await withPortableTransaction(async(client)=>{
  const wo=await client.query(`SELECT id FROM work_orders WHERE id=$1 AND account_id=$2 FOR UPDATE`,[id,session.accountId]);if(!wo.rows[0])throw new Error("WORK_ORDER_NOT_FOUND");
  const provenance={source:"titan-zero-field-api",recorded_at:new Date().toISOString(),idempotency_key:`${session.traceId}:defect:${parsed.data.defect_id}`,trace_id:session.traceId};
  const verified_by_ref=parsed.data.state==="verified"?session.userId:null;
  const defect=buildTitanFieldDefect({...parsed.data,company_id:canonicalCompanyIdFromSession(session.accountId),work_order_id:id,verified_by_ref,provenance});
  await recordGovernedDefectState(client as any,{accountId:session.accountId,company_id:defect.company_id,actorId:session.userId,traceId:session.traceId,role:session.role},defect);
 });return NextResponse.json({data:{defect_id:parsed.data.defect_id,state:parsed.data.state}})}
 catch(e){const missing=e instanceof Error&&e.message==="WORK_ORDER_NOT_FOUND";return NextResponse.json({error:{code:missing?"NOT_FOUND":"MUTATION_REJECTED",message:missing?"Work order not found":"Defect mutation rejected",traceId:session.traceId}},{status:missing?404:422});}
});
