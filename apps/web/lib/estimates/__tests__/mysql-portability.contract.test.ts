import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("estimate MySQL portability contract", () => {
  it("does not depend on PostgreSQL RETURNING or casts in the estimate repository", () => {
    const source = read("lib/estimates/repository.ts");
    expect(source).not.toMatch(/\bRETURNING\b/i);
    expect(source).not.toMatch(/::text\b/i);
    expect(source).toContain('sql.replace(/\\$(\\d+)/g, "?")');
  });

  it("uses portable IN placeholders rather than PostgreSQL ANY arrays on the estimate list", () => {
    const source = read("app/app/estimates/page.tsx");
    expect(source).not.toMatch(/\bANY\s*\(/i);
    expect(source).not.toMatch(/::text\[\]/i);
    expect(source).toContain("e.status IN");
  });

  it("keeps generated option IDs independent of database RETURNING semantics", () => {
    const source = read("lib/estimates/repository.ts");
    expect(source).toContain("const optionId = randomUUID()");
    expect(source).toContain("(id, estimate_id, label");
  });
});
