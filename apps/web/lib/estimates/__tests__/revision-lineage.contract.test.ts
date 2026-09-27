import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
describe("estimate revision lineage", () => {
  it("has a MySQL representation for existing revision lineage fields", () => {
    const sql=readFileSync(resolve(process.cwd(),"../../../db/mysql/010_estimate_revision_portable.sql"),"utf8");
    expect(sql).toContain("parent_estimate_id CHAR(36)");
    expect(sql).toContain("revision SMALLINT NOT NULL DEFAULT 1");
    expect(sql).not.toMatch(/jsonb|timestamptz|gen_random_uuid|::/i);
  });
});
