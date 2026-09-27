import { describe, expect, it } from "vitest";
import { assertNativeExecutionAuthority } from "../lib/titan/workforce-native/governance";
import type { TitanNativeWorkforceOperation } from "@titan-zero/titan-platform/workforce-native";

const operation = (method: TitanNativeWorkforceOperation["method"], mutating: boolean): TitanNativeWorkforceOperation => ({
  id: `test.${method.toLowerCase()}`,
  method,
  path: "/api/v1/test",
  purpose: "regression test",
  mutating,
});

describe("workforce-native execution authority boundary", () => {
  it("allows read-only operations without execution authority", () => {
    expect(() => assertNativeExecutionAuthority({ operation: operation("GET", false) })).not.toThrow();
  });

  it("fails closed for POST mutations when no canonical execution envelope exists", () => {
    expect(() => assertNativeExecutionAuthority({ operation: operation("POST", true) }))
      .toThrow("CANONICAL_EXECUTION_AUTHORITY_REQUIRED");
  });

  it("fails closed for PATCH mutations when no canonical execution envelope exists", () => {
    expect(() => assertNativeExecutionAuthority({ operation: operation("PATCH", true) }))
      .toThrow("CANONICAL_EXECUTION_AUTHORITY_REQUIRED");
  });

  it("allows an empty plan used by planning and dry-run paths", () => {
    expect(() => assertNativeExecutionAuthority({ operation: null })).not.toThrow();
  });
});
