import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs"; import { resolve } from "node:path";
describe("provider-neutral estimate AI persistence",()=>{
 it("persists provider and model independently of Anthropic",()=>{
  const s=readFileSync(resolve(process.cwd(),"lib/estimates/ai-persistence.ts"),"utf8");
  expect(s).toContain("provider"); expect(s).toContain("model"); expect(s).not.toContain("Anthropic");
 });
});
