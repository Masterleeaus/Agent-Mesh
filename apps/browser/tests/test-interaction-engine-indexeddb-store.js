const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
class FakeRequest{constructor(){this.result=undefined;this.error=null;this.onsuccess=null;this.onerror=null;this.onupgradeneeded=null;this.onblocked=null;}}
class FakeNames{constructor(values=[]){this.s=new Set(values)}contains(x){return this.s.has(x)}add(x){this.s.add(x)}}
class FakeIndex{constructor(store,name){this.store=store;this.name=name}}
class FakeStore{
 constructor(map,indexNames){this.map=map;this.indexNames=indexNames}
 createIndex(name){this.indexNames.add(name);return new FakeIndex(this,name)}
 put(v){this.map.set(v.key,structuredClone(v));const r=new FakeRequest();queueMicrotask(()=>{r.result=v.key;r.onsuccess&&r.onsuccess()});return r}
 get(k){const r=new FakeRequest();queueMicrotask(()=>{r.result=this.map.has(k)?structuredClone(this.map.get(k)):undefined;r.onsuccess&&r.onsuccess()});return r}
 getAll(){const r=new FakeRequest();queueMicrotask(()=>{r.result=[...this.map.values()].map(x=>structuredClone(x));r.onsuccess&&r.onsuccess()});return r}
 delete(k){this.map.delete(k);const r=new FakeRequest();queueMicrotask(()=>{r.result=undefined;r.onsuccess&&r.onsuccess()});return r}
 index(name){return new FakeIndex(this,name)}
}
class FakeTx{
 constructor(store){this.store=store;this._oncomplete=null;this.onerror=null;this.onabort=null;this.error=null;this.completed=false;queueMicrotask(()=>queueMicrotask(()=>{this.completed=true;if(this._oncomplete)this._oncomplete()}))}
 set oncomplete(fn){this._oncomplete=fn;if(this.completed&&fn)queueMicrotask(()=>fn())}
 get oncomplete(){return this._oncomplete}
 objectStore(){return this.store}
}
class FakeDB{
 constructor(){this.map=new Map();this.objectStoreNames=new FakeNames();this.indexNames=new FakeNames();this.version=1}
 createObjectStore(){this.objectStoreNames.add('records');this.store=new FakeStore(this.map,this.indexNames);return this.store}
 transaction(){return new FakeTx(this.store)}
 close(){}
}
class FakeIDB{
 constructor(){this.dbs=new Map()}
 open(name){const r=new FakeRequest();queueMicrotask(()=>{let db=this.dbs.get(name),fresh=false;if(!db){db=new FakeDB();this.dbs.set(name,db);fresh=true}r.result=db;if(fresh){r.transaction=new FakeTx(db.store);r.onupgradeneeded&&r.onupgradeneeded()}r.onsuccess&&r.onsuccess()});return r}
}
const code=fs.readFileSync(path.join(root,'src/interaction-engine/generated/indexeddb-store.js'),'utf8');
const box={structuredClone,queueMicrotask};box.globalThis=box;vm.createContext(box);vm.runInContext(code,box);
(async()=>{
 const fake=new FakeIDB(),factory=box.TitanInteractionIndexedDBStore;
 const store=factory.create({indexedDB:fake,database_name:'test-ie',retention_per_kind:2});
 assert.equal(store.schema,'titan-code-interaction-indexeddb-store/v1');assert.equal(store.company_scope,'company_id');assert.equal(store.network_required,false);
 const s1={company_id:'c1',actor_id:'a1',device_id:'d1'},s2={company_id:'c1',actor_id:'a2',device_id:'d1'},s3={company_id:'c2',actor_id:'a1',device_id:'d1'};
 await store.put(s1,'journey','j1',{status:'active'},1);let got=await store.get(s1,'journey','j1');assert.equal(got.payload.status,'active');assert.equal(got.company_id,'c1');
 assert.equal(await store.get(s2,'journey','j1'),null);assert.equal(await store.get(s3,'journey','j1'),null);
 await store.put(s1,'journey','j2',{status:'paused'},2);await store.put(s1,'journey','j3',{status:'active'},3);const list=await store.list(s1,'journey');assert.deepEqual(Array.from(list,x=>x.record_id),['j3','j2']);assert.equal(await store.get(s1,'journey','j1'),null);
 await store.put(s2,'journey','j1',{status:'other-actor'},1);assert.equal((await store.get(s2,'journey','j1')).payload.status,'other-actor');
 assert.throws(()=>factory.create({indexedDB:fake,retention_per_kind:0}),/ERR_OFFLINE_STORE_RETENTION_INVALID/);
 await assert.rejects(()=>store.put({...s1,tenant_company_id:'bad'},'journey','bad',{},1),/ERR_OFFLINE_STORE_LEGACY_COMPANY_SCOPE/);
 // Corruption recovery: mutate the backing record and prove get deletes it rather than leaking/throwing arbitrary data.
 const key='c1::a1::d1::journey::j2';fake.dbs.get('test-ie').map.get(key).payload_json='{bad json';const recovered=await store.get(s1,'journey','j2');assert.equal(recovered.corrupt,true);assert.equal(recovered.recovered,true);assert.equal(await store.get(s1,'journey','j2'),null);
 await store.remove(s2,'journey','j1');assert.equal(await store.get(s2,'journey','j1'),null);
 assert.equal('fetch' in box,false);assert.equal('chrome' in box,false);vm.runInContext(code,box);assert.equal(box.TitanInteractionIndexedDBStore.schema,'titan-code-interaction-indexeddb-store-factory/v1');
 console.log('INTERACTION_ENGINE_INDEXEDDB_STORE: PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
