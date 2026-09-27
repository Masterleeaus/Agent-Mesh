import test from "node:test";
import assert from "node:assert/strict";
import { WorkforceService } from "./index.js";
import { MemoryWorkforceStore } from "./memory-store.js";

const base = (company_id:string, work_id:string, dependencies:string[]=[]) => ({ company_id, work_id, objective:`work ${work_id}`, creator:"owner", priority:1, dependencies, required_capabilities:[] });

test("work lifecycle is company scoped and dependency aware", async () => {
  const store=new MemoryWorkforceStore(); const service=new WorkforceService(store);
  const first=await service.create(base("c1","w1")); assert.equal(first.state,"READY");
  const second=await service.create(base("c1","w2",["w1"])); assert.equal(second.state,"BLOCKED");
  await assert.rejects(()=>service.start("c2","w1","x"),/work not found/);
  await service.claim("c1","w1","agent-1"); await service.start("c1","w1","agent-1"); await service.complete("c1","w1","agent-1",{ok:true},["e1"]);
  assert.equal((await store.get("c1","w2"))?.state,"READY");
});

test("authority requirement waits for approval and delegation grants no authority", async () => {
  const store=new MemoryWorkforceStore();
  let checks=0;
  const service=new WorkforceService(store,undefined,{async isSatisfied(){checks++;return false;}});
  await service.create({...base("c1","w3"),authority_requirement:"schedule.change"});
  await service.delegate("c1","w3","agent-2","owner");
  assert.equal(checks,0);
  const claimed=await service.claim("c1","w3","agent-2");
  assert.equal(checks,1); assert.equal(claimed.state,"WAITING_APPROVAL");
});

test("circular dependencies are rejected", async () => {
  const store=new MemoryWorkforceStore(); const service=new WorkforceService(store);
  await service.create(base("c1","a"));
  await assert.rejects(()=>service.create(base("c1","b",["missing"])),/dependency not found/);
  await assert.rejects(()=>service.create(base("c1","self",["self"])),/circular dependency/);
});
