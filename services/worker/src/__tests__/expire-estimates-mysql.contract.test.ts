import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
describe("expire estimates portability",()=>{it("does not depend on RETURNING",()=>{
 const s=readFileSync(resolve(process.cwd(),"src/expire-estimates.ts"),"utf8");
 expect(s).not.toMatch(/\bRETURNING\b/i);
 expect(s).toContain("databaseDialect");
});});
