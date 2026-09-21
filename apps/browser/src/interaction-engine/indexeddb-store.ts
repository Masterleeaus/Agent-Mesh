(() => {
  type RecordValue = Record<string, unknown>;
  type StoreScope = Readonly<{company_id:string;actor_id:string;device_id:string}>;
  type StoredEnvelope = Readonly<{
    schema:"titan-interaction/offline-record/v1";
    key:string;
    scope_key:string;
    company_id:string;
    actor_id:string;
    device_id:string;
    kind:string;
    record_id:string;
    revision:number;
    payload_json:string;
  }>;
  type StoreOptions = Readonly<{database_name?:string;retention_per_kind?:number;indexedDB?:IDBFactory}>;

  const DB_VERSION=1, STORE_NAME="records", DEFAULT_RETENTION=128, MAX_RETENTION=512, MAX_ID=256, MAX_PAYLOAD=262144;
  const LEGACY=new Set(["tenant_id","tenant_company_id","tenantCompanyId","companyId"]);
  const fail=(code:string):never=>{throw new Error(code)};
  const rec=(v:unknown,code="ERR_OFFLINE_STORE_RECORD_INVALID"):RecordValue=>{if(!v||typeof v!=="object"||Array.isArray(v))fail(code);return v as RecordValue};
  const str=(v:unknown,name:string):string=>{if(typeof v!=="string")fail(`ERR_OFFLINE_STORE_${name.toUpperCase()}_INVALID`);const raw=v as string;const s=raw.trim();if(!s||s.length>MAX_ID)fail(`ERR_OFFLINE_STORE_${name.toUpperCase()}_INVALID`);return s};
  const noLegacy=(r:RecordValue)=>{for(const key of LEGACY)if(Object.prototype.hasOwnProperty.call(r,key))fail("ERR_OFFLINE_STORE_LEGACY_COMPANY_SCOPE")};
  const freeze=<T>(value:T):T=>{if(value&&typeof value==="object"){Object.freeze(value);for(const x of Object.values(value as any))if(x&&typeof x==="object"&&!Object.isFrozen(x))freeze(x)}return value};
  const scope=(value:unknown):StoreScope=>{const r=rec(value,"ERR_OFFLINE_STORE_SCOPE_INVALID");noLegacy(r);return freeze({company_id:str(r.company_id,"company_id"),actor_id:str(r.actor_id,"actor_id"),device_id:str(r.device_id,"device_id")})};
  const scopeKey=(s:StoreScope)=>`${s.company_id}::${s.actor_id}::${s.device_id}`;
  const makeKey=(s:StoreScope,kind:string,id:string)=>`${scopeKey(s)}::${kind}::${id}`;
  const request=<T>(req:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("ERR_OFFLINE_STORE_REQUEST"));});
  const txDone=(tx:IDBTransaction)=>new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("ERR_OFFLINE_STORE_TRANSACTION"));tx.onabort=()=>reject(tx.error||new Error("ERR_OFFLINE_STORE_TRANSACTION_ABORT"));});
  const normalizeEnvelope=(value:unknown,expected?:StoreScope):StoredEnvelope=>{
    const r=rec(value,"ERR_OFFLINE_STORE_ENVELOPE_INVALID");noLegacy(r);
    if(r.schema!=="titan-interaction/offline-record/v1")fail("ERR_OFFLINE_STORE_ENVELOPE_SCHEMA");
    const s=scope(r),kind=str(r.kind,"kind"),record_id=str(r.record_id,"record_id");
    if(!Number.isInteger(r.revision)||Number(r.revision)<0)fail("ERR_OFFLINE_STORE_REVISION_INVALID");
    if(typeof r.payload_json!=="string")fail("ERR_OFFLINE_STORE_PAYLOAD_INVALID");
    const payload_json=r.payload_json as string;if(payload_json.length>MAX_PAYLOAD)fail("ERR_OFFLINE_STORE_PAYLOAD_INVALID");
    try{JSON.parse(payload_json)}catch{fail("ERR_OFFLINE_STORE_PAYLOAD_CORRUPT")}
    const sk=scopeKey(s), key=makeKey(s,kind,record_id);
    if(r.scope_key!==sk||r.key!==key)fail("ERR_OFFLINE_STORE_KEY_MISMATCH");
    if(expected&&(s.company_id!==expected.company_id||s.actor_id!==expected.actor_id||s.device_id!==expected.device_id))fail("ERR_OFFLINE_STORE_SCOPE_MISMATCH");
    return freeze({schema:"titan-interaction/offline-record/v1" as const,key,scope_key:sk,...s,kind,record_id,revision:Number(r.revision),payload_json});
  };
  function createStore(options:StoreOptions={}){
    const factory=options.indexedDB||globalThis.indexedDB;if(!factory)fail("ERR_OFFLINE_STORE_INDEXEDDB_UNAVAILABLE");
    const databaseName=str(options.database_name||"titan-code-interaction-engine","database_name");
    const retention=options.retention_per_kind===undefined?DEFAULT_RETENTION:Number(options.retention_per_kind);
    if(!Number.isInteger(retention)||retention<1||retention>MAX_RETENTION)fail("ERR_OFFLINE_STORE_RETENTION_INVALID");
    let dbPromise:Promise<IDBDatabase>|null=null;
    const open=()=>{if(dbPromise)return dbPromise;dbPromise=new Promise<IDBDatabase>((resolve,reject)=>{const req=factory.open(databaseName,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;let store:IDBObjectStore;if(!db.objectStoreNames.contains(STORE_NAME)){store=db.createObjectStore(STORE_NAME,{keyPath:"key"});store.createIndex("scope_kind","scope_kind",{unique:false});store.createIndex("scope","scope_key",{unique:false});}else{store=req.transaction!.objectStore(STORE_NAME);if(!store.indexNames.contains("scope_kind"))store.createIndex("scope_kind","scope_kind",{unique:false});if(!store.indexNames.contains("scope"))store.createIndex("scope","scope_key",{unique:false});}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("ERR_OFFLINE_STORE_OPEN"));req.onblocked=()=>reject(new Error("ERR_OFFLINE_STORE_BLOCKED"));});return dbPromise};
    const prune=async(db:IDBDatabase,s:StoreScope,kind:string)=>{const tx=db.transaction(STORE_NAME,"readwrite"),store=tx.objectStore(STORE_NAME),all:any[]=await request(store.getAll());const prefix=`${scopeKey(s)}::${kind}::`;const matches=all.filter(x=>x&&typeof x.key==="string"&&x.key.startsWith(prefix)).sort((a,b)=>(Number(b.revision)-Number(a.revision))||String(a.key).localeCompare(String(b.key)));for(const stale of matches.slice(retention))store.delete(stale.key);await txDone(tx)};
    const put=async(scopeValue:unknown,kindValue:unknown,idValue:unknown,payload:unknown,revisionValue:unknown)=>{const s=scope(scopeValue),kind=str(kindValue,"kind"),record_id=str(idValue,"record_id");if(!Number.isInteger(revisionValue)||Number(revisionValue)<0)fail("ERR_OFFLINE_STORE_REVISION_INVALID");let payload_json:string="";try{const encoded=JSON.stringify(payload);if(encoded===undefined)fail("ERR_OFFLINE_STORE_PAYLOAD_INVALID");payload_json=encoded}catch{fail("ERR_OFFLINE_STORE_PAYLOAD_INVALID")}if(payload_json===undefined||payload_json.length>MAX_PAYLOAD)fail("ERR_OFFLINE_STORE_PAYLOAD_INVALID");const envelope:any={schema:"titan-interaction/offline-record/v1",key:makeKey(s,kind,record_id),scope_key:scopeKey(s),scope_kind:`${scopeKey(s)}::${kind}`,...s,kind,record_id,revision:Number(revisionValue),payload_json};const normalized=normalizeEnvelope(envelope,s);const db=await open();const tx=db.transaction(STORE_NAME,"readwrite");tx.objectStore(STORE_NAME).put({...normalized,scope_kind:envelope.scope_kind});await txDone(tx);await prune(db,s,kind);return normalized};
    const get=async(scopeValue:unknown,kindValue:unknown,idValue:unknown)=>{const s=scope(scopeValue),kind=str(kindValue,"kind"),record_id=str(idValue,"record_id"),db=await open(),tx=db.transaction(STORE_NAME,"readwrite"),store=tx.objectStore(STORE_NAME),key=makeKey(s,kind,record_id),raw=await request<any>(store.get(key));if(raw===undefined){await txDone(tx);return null}try{const normalized=normalizeEnvelope(raw,s);await txDone(tx);return freeze({...normalized,payload:JSON.parse(normalized.payload_json)})}catch(error){store.delete(key);await txDone(tx);const e:any=error;if(e&&typeof e.message==="string"&&e.message.startsWith("ERR_OFFLINE_STORE_"))return freeze({corrupt:true,recovered:true,key,error:e.message});throw error}};
    const remove=async(scopeValue:unknown,kindValue:unknown,idValue:unknown)=>{const s=scope(scopeValue),kind=str(kindValue,"kind"),record_id=str(idValue,"record_id"),db=await open(),tx=db.transaction(STORE_NAME,"readwrite");tx.objectStore(STORE_NAME).delete(makeKey(s,kind,record_id));await txDone(tx);return true};
    const list=async(scopeValue:unknown,kindValue:unknown)=>{const s=scope(scopeValue),kind=str(kindValue,"kind"),db=await open(),tx=db.transaction(STORE_NAME,"readonly"),raw:any[]=await request(tx.objectStore(STORE_NAME).getAll());await txDone(tx);const prefix=`${scopeKey(s)}::${kind}::`;return freeze(raw.filter(x=>x&&typeof x.key==="string"&&x.key.startsWith(prefix)).map(x=>normalizeEnvelope(x,s)).sort((a,b)=>(b.revision-a.revision)||a.key.localeCompare(b.key)).map(x=>freeze({...x,payload:JSON.parse(x.payload_json)})))};
    const close=async()=>{if(dbPromise){const db=await dbPromise;db.close();dbPromise=null}};
    return freeze({schema:"titan-code-interaction-indexeddb-store/v1",version:1,database_name:databaseName,database_version:DB_VERSION,store_name:STORE_NAME,retention_per_kind:retention,company_scope:"company_id",actor_scope:true,device_scope:true,network_required:false,provider_required:false,put,get,list,remove,close});
  }
  const api=freeze({schema:"titan-code-interaction-indexeddb-store-factory/v1",version:1,create:createStore});
  const g=globalThis as any,existing=g.TitanInteractionIndexedDBStore;if(existing&&existing.schema!==api.schema)fail("ERR_OFFLINE_STORE_CONFLICT");if(!existing)g.TitanInteractionIndexedDBStore=api;
})();
