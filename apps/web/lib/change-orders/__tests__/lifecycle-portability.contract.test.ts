import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("change order lifecycle portability",()=>{
  it("creates IDs in application code without INSERT RETURNING",()=>{
    const s=read("app/api/v1/change-orders/route.ts");
    expect(s).toContain("randomUUID()");
    expect(s).not.toMatch(/\bRETURNING\b/i);
  });
  it("serializes lifecycle actions",()=>{
    const s=read("app/api/v1/change-orders/[id]/route.ts");
    expect(s).toContain("FOR UPDATE");
  });
  it("keeps audit old and new status",()=>{
    const s=read("app/api/v1/change-orders/[id]/route.ts");
    expect(s).toContain("old_value: { status: existing.status }");
  });
});
