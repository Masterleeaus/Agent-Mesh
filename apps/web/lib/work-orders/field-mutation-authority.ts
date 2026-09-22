import type { Role } from "@ai-fsm/domain";
import { canDeferCriticalFieldDefect, canManageFieldPermits, canRecordFieldInspectionResult, canVerifyFieldDefects } from "@/lib/auth/permissions";

export type FieldMutationKind="permit_state"|"inspection_result"|"defect_state";
export interface FieldMutationAuthorityInput{role:Role;actor_id:string;kind:FieldMutationKind;next_state?:string;severity?:string;verified_by_ref?:string|null;defer_reason?:string|null}
export function assertFieldMutationAuthority(input:FieldMutationAuthorityInput):void{
 const actor=String(input.actor_id??"").trim();if(!actor)throw new Error("actor_id is required");
 if(input.kind==="permit_state"){if(!canManageFieldPermits(input.role))throw new Error("permit state mutation requires owner or admin authority");return;}
 if(input.kind==="inspection_result"){if(!canRecordFieldInspectionResult(input.role))throw new Error("inspection result mutation requires owner or admin authority");return;}
 const state=String(input.next_state??"").trim();
 if(state==="verified"){
   if(!canVerifyFieldDefects(input.role))throw new Error("defect verification requires owner or admin authority");
   if(String(input.verified_by_ref??"").trim()!==actor)throw new Error("verified_by_ref must identify the authorized verifier");
 }
 if(state==="deferred"&&input.severity==="critical"){
   if(!canDeferCriticalFieldDefect(input.role))throw new Error("critical defect deferral requires owner authority");
   if(!String(input.defer_reason??"").trim())throw new Error("critical defect deferral requires a reason");
 }
}
