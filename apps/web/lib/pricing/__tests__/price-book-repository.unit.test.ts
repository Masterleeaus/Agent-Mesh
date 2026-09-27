import { describe, expect, it } from "vitest";
import { buildPriceBookListQuery } from "../price-book-repository";

describe("buildPriceBookListQuery", () => {
  it("builds PostgreSQL filters without leaking PostgreSQL-only casts into the shared projection", () => {
    const result = buildPriceBookListQuery("postgres", {
      category: "general_repairs",
      tier: "standard",
      search: "door",
      activeOnly: true,
      limit: 25,
    });
    expect(result.sql).toContain("category = $1");
    expect(result.sql).toContain("LOWER(code) LIKE LOWER($3)");
    expect(result.sql).toContain("LIMIT $4");
    expect(result.sql).not.toContain("::text");
    expect(result.sql).not.toContain("ILIKE");
    expect(result.params).toEqual(["general_repairs", "standard", "%door%", 25]);
  });

  it("builds MySQL/MariaDB placeholders and boolean filtering portably", () => {
    const result = buildPriceBookListQuery("mysql", {
      search: "paint",
      activeOnly: true,
      limit: 100,
    });
    expect(result.sql).toContain("is_active = ?");
    expect(result.sql).toContain("LOWER(code) LIKE LOWER(?)");
    expect(result.sql).toContain("LIMIT ?");
    expect(result.sql).not.toContain("$1");
    expect(result.sql).not.toContain("'{}'");
    expect(result.params).toEqual([true, "%paint%", "%paint%", "%paint%", 100]);
  });
});
