import type { StorageContextInput, StorageRecord } from "../storage/index.js";
import {
  createCompanyRelationship,
  createUnderstandingState,
  type CompanyRelationship,
  type UnderstandingEvidence,
  type UnderstandingState,
} from "./contracts.js";

const MODULE_ID="personal-zero";
const RELATIONSHIPS="relationships";
const EVIDENCE="understanding-evidence";
const UNDERSTANDING="understanding";

type Repository=Readonly<{
  put(context:StorageContextInput,input:Readonly<{module_id:string;collection:string;record_id:string;expected_revision?:number;data?:unknown}>):Promise<StorageRecord>;
  get(context:StorageContextInput,module_id:string,collection:string,record_id:string):Promise<StorageRecord|null>;
  list(context:StorageContextInput,query?:Readonly<{module_id?:string;collection?:string}>):Promise<readonly StorageRecord[]>;
}>;

function requireRelationshipMatch(relationship:CompanyRelationship,one_id:string,zero_id:string,company_id:string){
  if(relationship.one_id!==one_id||relationship.zero_id!==zero_id||relationship.company_id!==company_id)throw new Error("Personal Zero relationship identity/company mismatch");
  if(relationship.status!=="active")throw new Error("Personal Zero relationship is revoked");
}
function recordData<T>(row:StorageRecord|null):T|null{return row?.data?structuredClone(row.data) as T:null}

export function createPersonalZeroStateService({repository,clock=()=>Date.now()}:{repository:Repository;clock?:()=>number}){
  if(!repository?.put||!repository?.get||!repository?.list)throw new Error("Canonical Titan storage repository is required");
  return Object.freeze({
    descriptor:Object.freeze({protocol:"titan.personal-zero.state.v1",module_id:MODULE_ID,company_boundary:"company_id",authority_neutral:true,execution_authority:false}),

    async putRelationship(context:StorageContextInput,input:CompanyRelationship){
      const relationship=createCompanyRelationship(input);
      return repository.put(context,{module_id:MODULE_ID,collection:RELATIONSHIPS,record_id:relationship.relationship_id,data:relationship});
    },

    async revokeRelationship(context:StorageContextInput,relationship_id:string){
      const row=await repository.get(context,MODULE_ID,RELATIONSHIPS,relationship_id);
      const current=recordData<CompanyRelationship>(row);
      if(!row||!current)throw new Error("Personal Zero relationship not found");
      const revoked=createCompanyRelationship({...current,status:"revoked",revoked_at:Number(clock())});
      return repository.put(context,{module_id:MODULE_ID,collection:RELATIONSHIPS,record_id:relationship_id,expected_revision:row.version,data:revoked});
    },

    async putUnderstandingEvidence(context:StorageContextInput,input:UnderstandingEvidence){
      if(!input.relationship_id)throw new Error("Company-scoped understanding evidence requires relationship_id");
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,input.relationship_id));
      if(!relationship)throw new Error("Personal Zero relationship not found");
      requireRelationshipMatch(relationship,input.one_id,input.zero_id,input.company_id);
      return repository.put(context,{module_id:MODULE_ID,collection:EVIDENCE,record_id:input.understanding_evidence_id,data:input});
    },

    async promoteUnderstanding(context:StorageContextInput,input:UnderstandingState){
      if(input.status!=="candidate"&&input.status!=="accepted")throw new Error("Promotion status must be candidate or accepted");
      if(!input.relationship_id)throw new Error("Company-scoped understanding requires relationship_id");
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,input.relationship_id));
      if(!relationship)throw new Error("Personal Zero relationship not found");
      requireRelationshipMatch(relationship,input.one_id,input.zero_id,input.company_id);
      for(const evidenceId of input.evidence_refs){
        const evidence=recordData<UnderstandingEvidence>(await repository.get(context,MODULE_ID,EVIDENCE,evidenceId));
        if(!evidence)throw new Error(`Understanding evidence not found: ${evidenceId}`);
        if(evidence.one_id!==input.one_id||evidence.zero_id!==input.zero_id||evidence.company_id!==input.company_id||evidence.relationship_id!==input.relationship_id)throw new Error("Cross-context understanding evidence rejected");
      }
      const state=createUnderstandingState(input);
      return repository.put(context,{module_id:MODULE_ID,collection:UNDERSTANDING,record_id:state.understanding_id,data:state});
    },

    async correctUnderstanding(context:StorageContextInput,current_id:string,replacement:UnderstandingState){
      const priorRow=await repository.get(context,MODULE_ID,UNDERSTANDING,current_id);
      const prior=recordData<UnderstandingState>(priorRow);
      if(!priorRow||!prior)throw new Error("Understanding state not found");
      if(replacement.supersedes_understanding_id!==current_id)throw new Error("Correction must preserve supersession lineage");
      if(prior.one_id!==replacement.one_id||prior.zero_id!==replacement.zero_id||prior.company_id!==replacement.company_id||prior.relationship_id!==replacement.relationship_id)throw new Error("Cross-context correction rejected");
      const next=await this.promoteUnderstanding(context,replacement);
      const superseded=createUnderstandingState({...prior,status:"superseded",updated_at:Number(clock())});
      await repository.put(context,{module_id:MODULE_ID,collection:UNDERSTANDING,record_id:current_id,expected_revision:priorRow.version,data:superseded});
      return next;
    },

    async listUnderstanding(context:StorageContextInput,relationship_id:string){
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,relationship_id));
      if(!relationship||relationship.status!=="active")return [];
      const rows=await repository.list(context,{module_id:MODULE_ID,collection:UNDERSTANDING});
      return rows.map(row=>recordData<UnderstandingState>(row)).filter((state):state is UnderstandingState=>Boolean(state&&state.relationship_id===relationship_id&&state.company_id===relationship.company_id&&state.one_id===relationship.one_id&&state.zero_id===relationship.zero_id&&state.status!=="deleted"&&state.status!=="expired"));
    }
  });
}
