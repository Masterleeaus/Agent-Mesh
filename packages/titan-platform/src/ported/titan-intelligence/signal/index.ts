export type TitanSignal=Readonly<{id:string;company_id:string;kind:string;priority?:number;confidence?:number;created_at?:string;payload?:unknown}>;

const clean=(v:unknown,n:string)=>{const s=String(v??"").trim();if(!s)throw new TypeError(`${n}-required`);return s;};

export function normalizeSignal(input:TitanSignal){
 const company_id=clean(input.company_id,"company_id");
 const id=clean(input.id,"signal-id");
 const kind=clean(input.kind,"signal-kind");
 const priority=Number.isFinite(Number(input.priority))?Number(input.priority):0;
 const confidence=Math.max(0,Math.min(1,Number.isFinite(Number(input.confidence))?Number(input.confidence):0));
 return Object.freeze({...input,id,company_id,kind,priority,confidence,authority_neutral:true as const,execution_authority:false as const});
}

export function prioritizeSignals(signals:readonly TitanSignal[],company_id:string){
 const cid=clean(company_id,"company_id");
 return Object.freeze(signals.map(normalizeSignal).filter(s=>s.company_id===cid).sort((a,b)=>b.priority-a.priority||b.confidence-a.confidence||a.id.localeCompare(b.id)));
}

export const SIGNAL_POLICY=Object.freeze({tenant_boundary:"company_id" as const,deterministic:true as const,signal_is_authority:false as const,execution_authority:false as const});
