import { readFileSync } from "node:fs"; import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
const s=()=>readFileSync(resolve(process.cwd(),"lib/estimates/approve.ts"),"utf8");
describe("deposit approval artifacts",()=>{
 it("does not depend on INSERT RETURNING",()=>expect(s()).not.toMatch(/\bRETURNING\b/i));
 it("locks estimate before deposit creation",()=>expect(s()).toContain("FOR UPDATE"));
 it("generates the deposit invoice id in application code",()=>expect(s()).toContain("randomUUID()"));
});
