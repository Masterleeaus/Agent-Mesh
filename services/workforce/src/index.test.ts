import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceService } from "./index.js";
import { MemoryWorkforceStore } from "./memory-store.js";

const input=(company_id:string,work_id:string,deps:string[]=[])=>({company_id,work_id,objective:work_id,creator:"one",priority:1,dependencies:deps,required_capabilities:[]});

test("create, claim, start and complete", async()=>{ const s=new MemoryWorkforceStore(); const w=new WorkforceService(s); assert.equal((await w.create(input("a","1"))).state,"READY"); assert.equal((await w.claim("a","1","agent")).state,"CLAIMED"); await w.start("a","1","agent"); assert.equal((await w.complete("a","1","agent",{ok:true},["receipt:1"])).state,"COMPLETED"); });

test("dependency blocks then wakes downstream", async()=>{ const s=new MemoryWorkforceStore(); let woke=0; const w=new WorkforceService(s,{wake:async()=>{woke++;}}); await w.create(input("a","first")); const second=await w.create({...input("a","second",["first"]),assignee:"agent"}); assert.equal(second.state,"BLOCKED"); await w.claim("a","first","agent"); await w.start("a","first","agent"); await w.complete("a","first","agent"); assert.equal((await s.get("a","second"))?.state,"READY"); assert.equal(woke,1); });

test("rejects circular dependency and cross-company dependency", async()=>{ const s=new MemoryWorkforceStore(); const w=new WorkforceService(s); await w.create(input("a","root")); await assert.rejects(()=>w.create(input("b","child",["root"])),/dependency not found/); await assert.rejects(()=>w.create(input("a","self",["self"])),/circular/); });

test("delegation does not grant authority", async()=>{ const s=new MemoryWorkforceStore(); const w=new WorkforceService(s,undefined,{isSatisfied:async()=>false}); await w.create({...input("a","refund"),authority_requirement:"payments.refund"}); await w.delegate("a","refund","finance","manager"); assert.equal((await w.claim("a","refund","finance")).state,"WAITING_APPROVAL"); });

test("duplicate claim is rejected", async()=>{ const s=new MemoryWorkforceStore(); const w=new WorkforceService(s); await w.create(input("a","x")); await w.claim("a","x","one"); await assert.rejects(()=>w.claim("a","x","two"),/not READY/); });

test("waiting work resumes explicitly", async()=>{ const s=new MemoryWorkforceStore(); const w=new WorkforceService(s); await w.create(input("a","x")); await w.claim("a","x","agent"); await w.start("a","x","agent"); await w.wait("a","x","agent","WAITING_EXTERNAL"); assert.equal((await w.resume("a","x","signal")).state,"READY"); });
