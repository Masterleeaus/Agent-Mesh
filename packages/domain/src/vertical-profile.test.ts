import { describe, expect, it } from "vitest";
import { compileVerticalProfile } from "./vertical-profile";

describe("declarative vertical profiles", () => {
  it("compiles deterministic declarative differences", () => {
    expect(compileVerticalProfile({ profile_id: "plumbing", version: "1", terminology: { job: "callout", customer: "homeowner" }, templates: ["drain", "drain"], workflow_defaults: ["quote"], canonical_dependencies: ["jobs", "scheduling"], forbidden_owners: [] })).toMatchObject({ profile_id: "plumbing", templates: ["drain"], provenance: "canonical-profile-compiler/v1" });
  });
  it("rejects vertical attempts to replace canonical owners", () => expect(() => compileVerticalProfile({ profile_id: "bad", version: "1", terminology: {}, templates: [], workflow_defaults: [], canonical_dependencies: ["jobs"], forbidden_owners: ["authority"] })).toThrow("vertical_forbidden_owner:authority"));
});

