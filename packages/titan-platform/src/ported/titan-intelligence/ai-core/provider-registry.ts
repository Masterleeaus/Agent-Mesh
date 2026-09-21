// Canonical TypeScript AI Core provider registry.
// Provider identity/registration never grants execution authority.

export type AiProviderLocality = "device" | "customer-hosted" | "byo-cloud" | "titan-managed";

export type AiProviderRegistration = Readonly<{
  id: string;
  locality: AiProviderLocality;
  company_id?: string | null;
  capabilities?: readonly string[];
  enabled?: boolean;
}>;

const ID=/^[a-z0-9][a-z0-9._-]{0,127}$/;
const LOCALITY=new Set<AiProviderLocality>(["device","customer-hosted","byo-cloud","titan-managed"]);

export class AiProviderRegistry {
  readonly #providers=new Map<string,AiProviderRegistration>();

  register(input: AiProviderRegistration) {
    if(!ID.test(input.id)) throw new Error("Invalid AI provider id.");
    if(!LOCALITY.has(input.locality)) throw new Error("Invalid AI provider locality.");
    const company=input.company_id==null?null:String(input.company_id).trim();
    if(input.company_id!=null&&!company) throw new Error("company_id-required");
    const key=`${company??"*"}|${input.id}`;
    const provider=Object.freeze({
      ...input,
      company_id:company,
      capabilities:Object.freeze([...new Set(input.capabilities??[])].sort()),
      enabled:input.enabled!==false,
      authority_neutral:true as const,
      execution_authority:false as const,
    });
    this.#providers.set(key,provider);
    return provider;
  }

  resolve(id:string, company_id?:string|null) {
    const company=company_id==null?null:String(company_id).trim();
    if(company_id!=null&&!company) throw new Error("company_id-required");
    const scoped=company?this.#providers.get(`${company}|${id}`):undefined;
    const global=this.#providers.get(`*|${id}`);
    const provider=scoped??global??null;
    return provider?.enabled===false?null:provider;
  }
}

export const AI_CORE_PROVIDER_LOCALITY_ORDER=Object.freeze([
  "device","customer-hosted","byo-cloud","titan-managed",
] as const);
