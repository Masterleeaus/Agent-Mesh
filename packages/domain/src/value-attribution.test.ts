import { describe, expect, it } from "vitest";
import { projectVerifiedValue } from "./value-attribution";

const context = { company_id: "a", correlation_id: "corr" };
const evidence = (id: string, key: string, extra = {}) => ({ company_id: "a", attribution_key: key, evidence_id: id, outcome_id: `outcome-${id}`, gross_value_cents: 1000, cost_cents: 300, verified: true, correction_of: null, ...extra });

describe("verified value attribution", () => {
  it("anti-double-counts attribution keys and excludes unverified or cross-company evidence", () => {
    const ledger = projectVerifiedValue(context, [evidence("e1", "job-1"), evidence("e2", "job-1"), { ...evidence("e3", "job-2"), verified: false }, { ...evidence("e4", "other"), company_id: "b" }]);
    expect(ledger).toMatchObject({ gross_value_cents: 1000, cost_cents: 300, net_value_cents: 700 });
    expect(ledger.entries).toHaveLength(1);
  });
  it("reverses superseded evidence and remains reconstructable", () => {
    const ledger = projectVerifiedValue(context, [evidence("e1", "job-1"), evidence("e2", "job-1-correction", { gross_value_cents: 800, cost_cents: 200, correction_of: "e1" })]);
    expect(ledger).toMatchObject({ gross_value_cents: 800, cost_cents: 200, net_value_cents: 600 });
    expect(ledger.entries[0].evidence_id).toBe("e2");
  });
});

