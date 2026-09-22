import type { StorageContextInput, StorageRecord } from "../storage/index.js";
import {
  createCompanyRelationship,
  createUnderstandingState,
  type CompanyRelationship,
  type UnderstandingEvidence,
  type UnderstandingState,
  createExperienceRecord,
  createCognitiveEvent,
  type ExperienceRecord,
  type CognitiveEvent,
  createCrossContextShareGrant,
  scorePrediction,
  isFresh,
  type CrossContextShareGrant,
} from "./contracts.js";

const MODULE_ID="personal-zero";
const RELATIONSHIPS="relationships";
const EVIDENCE="understanding-evidence";
const UNDERSTANDING="understanding";
const EXPERIENCES="experiences";
const COGNITIVE_EVENTS="cognitive-events";
const SHARE_GRANTS="cross-context-share-grants";
const CALIBRATIONS="prediction-calibrations";

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

    async putExperience(context:StorageContextInput,input:ExperienceRecord,verifiedOutcome?:Readonly<{company_id:string;outcome_id:string;verified:boolean;receipt_refs:readonly string[]}>){
      if(!input.relationship_id)throw new Error("Company-scoped experience requires relationship_id");
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,input.relationship_id));
      if(!relationship)throw new Error("Personal Zero relationship not found");
      requireRelationshipMatch(relationship,input.one_id,input.zero_id,input.company_id);
      if(input.actual_outcome!=null){
        if(!verifiedOutcome||!verifiedOutcome.verified||verifiedOutcome.company_id!==input.company_id||verifiedOutcome.outcome_id!==input.verified_outcome_ref||verifiedOutcome.receipt_refs.length===0)throw new Error("Verified outcome proof required for actual outcome");
      }
      const experience=createExperienceRecord(input);
      return repository.put(context,{module_id:MODULE_ID,collection:EXPERIENCES,record_id:experience.experience_id,data:experience});
    },

    async appendCognitiveEvent(context:StorageContextInput,input:Omit<CognitiveEvent,"authority_neutral"|"execution_authority">){
      if(!input.relationship_id)throw new Error("Company-scoped cognitive event requires relationship_id");
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,input.relationship_id));
      if(!relationship)throw new Error("Personal Zero relationship not found");
      requireRelationshipMatch(relationship,input.one_id,input.zero_id,input.company_id);
      const event=createCognitiveEvent(input);
      return repository.put(context,{module_id:MODULE_ID,collection:COGNITIVE_EVENTS,record_id:event.event_id,data:event});
    },

    async scorePredictionOutcome(context:StorageContextInput,input:{relationship_id:string;prediction_event_id:string;outcome_event_id:string;predicted_probability:number;actual:boolean;scored_at?:number}){
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,input.relationship_id));
      if(!relationship||relationship.status!=="active")throw new Error("Personal Zero relationship not active");
      const prediction=recordData<CognitiveEvent>(await repository.get(context,MODULE_ID,COGNITIVE_EVENTS,input.prediction_event_id));
      const outcome=recordData<CognitiveEvent>(await repository.get(context,MODULE_ID,COGNITIVE_EVENTS,input.outcome_event_id));
      if(!prediction||prediction.type!=="prediction"||!outcome||outcome.type!=="outcome")throw new Error("Prediction and outcome events are required");
      for(const event of [prediction,outcome])requireRelationshipMatch(relationship,event.one_id,event.zero_id,event.company_id);
      if(prediction.relationship_id!==input.relationship_id||outcome.relationship_id!==input.relationship_id)throw new Error("Cross-context prediction calibration rejected");
      const calibration=scorePrediction(input);
      return repository.put(context,{module_id:MODULE_ID,collection:CALIBRATIONS,record_id:`${input.prediction_event_id}:${input.outcome_event_id}`,data:{...calibration,company_id:relationship.company_id,one_id:relationship.one_id,zero_id:relationship.zero_id,relationship_id:input.relationship_id}});
    },

    async putCrossContextShareGrant(context:StorageContextInput,input:Omit<CrossContextShareGrant,"authority_neutral">){
      const grant=createCrossContextShareGrant(input);
      if(context.company_id!==grant.source_company_id)throw new Error("Share grant must be created from source company context");
      const source=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,grant.source_relationship_id));
      if(!source)throw new Error("Source relationship not found");
      requireRelationshipMatch(source,grant.one_id,grant.zero_id,grant.source_company_id);
      return repository.put(context,{module_id:MODULE_ID,collection:SHARE_GRANTS,record_id:grant.grant_id,data:grant});
    },

    async getSharedUnderstanding(context:StorageContextInput,source_company_id:string,grant_id:string,now=Date.now()){
      if(context.company_id!==source_company_id)throw new Error("Shared understanding lookup must use source company context");
      const grant=recordData<CrossContextShareGrant>(await repository.get(context,MODULE_ID,SHARE_GRANTS,grant_id));
      if(!grant||grant.source_company_id!==source_company_id||grant.revoked_at!=null||(grant.expires_at!=null&&grant.expires_at<=now))return [];
      const rows=await repository.list(context,{module_id:MODULE_ID,collection:UNDERSTANDING});
      return rows.map(r=>recordData<UnderstandingState>(r)).filter((state):state is UnderstandingState=>Boolean(state&&state.relationship_id===grant.source_relationship_id&&state.status==="accepted"&&grant.subject_refs.includes(state.subject)));
    },

    async getConsumerProjection(context:StorageContextInput,relationship_id:string,consumer:"interaction"|"decision"|"workforce"){
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,relationship_id));
      if(!relationship||relationship.status!=="active")return null;
      const [understandingRows,experienceRows,eventRows]=await Promise.all([
        repository.list(context,{module_id:MODULE_ID,collection:UNDERSTANDING}),
        repository.list(context,{module_id:MODULE_ID,collection:EXPERIENCES}),
        repository.list(context,{module_id:MODULE_ID,collection:COGNITIVE_EVENTS}),
      ]);
      const same=<T extends {one_id:string;zero_id:string;company_id:string;relationship_id:string|null}>(x:T|null):x is T=>Boolean(x&&x.one_id===relationship.one_id&&x.zero_id===relationship.zero_id&&x.company_id===relationship.company_id&&x.relationship_id===relationship_id);
      const now=Number(clock());
      const evidenceRows=await repository.list(context,{module_id:MODULE_ID,collection:EVIDENCE});
      const freshEvidence=new Set(evidenceRows.map(r=>recordData<UnderstandingEvidence>(r)).filter(e=>e&&same(e)&&isFresh(e.fresh_until,now)).map(e=>e!.understanding_evidence_id));
      const understanding=understandingRows.map(r=>recordData<UnderstandingState>(r)).filter(s=>same(s)&&s.status==="accepted"&&s.evidence_refs.some(ref=>freshEvidence.has(ref)));
      const experiences=experienceRows.map(r=>recordData<ExperienceRecord>(r)).filter(same);
      const events=eventRows.map(r=>recordData<CognitiveEvent>(r)).filter(same);
      return Object.freeze({protocol:"titan.personal-zero.projection.v1",consumer,company_id:relationship.company_id,one_id:relationship.one_id,zero_id:relationship.zero_id,relationship_id,understanding:Object.freeze(understanding),experiences:Object.freeze(experiences),cognitive_events:Object.freeze(events),authority_refs:Object.freeze([...relationship.authority_refs]),authority_neutral:true,execution_authority:false});
    },

    async listUnderstanding(context:StorageContextInput,relationship_id:string){
      const relationship=recordData<CompanyRelationship>(await repository.get(context,MODULE_ID,RELATIONSHIPS,relationship_id));
      if(!relationship||relationship.status!=="active")return [];
      const rows=await repository.list(context,{module_id:MODULE_ID,collection:UNDERSTANDING});
      return rows.map(row=>recordData<UnderstandingState>(row)).filter((state):state is UnderstandingState=>Boolean(state&&state.relationship_id===relationship_id&&state.company_id===relationship.company_id&&state.one_id===relationship.one_id&&state.zero_id===relationship.zero_id&&state.status!=="deleted"&&state.status!=="expired"));
    }
  });
}
