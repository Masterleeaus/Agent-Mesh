import { describe, expect, it, vi } from "vitest";
import {
  CompanyStorageResolutionError,
  createCompanyStorageResolver,
  type CompanyPlacementRecord,
  type VerifiedCompanyScope,
} from "../../../../packages/storage/src/company-storage-resolver";
import type { StorageClient } from "../../../../packages/storage/src/index";
import { NativeCompanyStoreCloseAfterOperationError, withNativeCompanyStore } from "./consumer";

const scope: VerifiedCompanyScope = {
  kind: "authenticated",
  current: {
    company_id: "company-a", actor_id: "actor-a", session_id: "session-a",
    session_revision: 2, context_revision: "membership-2", audience: "titan-web",
    expires_at: "2026-10-03T00:00:00.000Z", authority_neutral: true,
  },
};

function setup(options: {
  status?: CompanyPlacementRecord["status"];
  company_id?: string;
  revision?: number;
  assertPhysicalPath?: () => Promise<void>;
  close?: () => Promise<void>;
} = {}) {
  let revision = options.revision ?? 4;
  const client: StorageClient = {
    dialect: "sqlite",
    query: vi.fn(async () => ({ rows: [], rowCount: 0 })),
    transaction: vi.fn(async fn => fn(client)),
    close: vi.fn(options.close ?? (async () => undefined)),
  };
  const registry = {
    findByCompanyId: vi.fn(async (companyId: string) => ({
      company_id: options.company_id ?? companyId,
      placement_id: "opaque-company-a", placement_revision: revision,
      provider: "sqlite" as const, schema_version: "native-fsm/1",
      status: options.status ?? "READY",
    })),
  };
  const opener = {
    open: vi.fn(async (placement: { company_id: string; placement_id: string; placement_revision: number;
      provider: "sqlite"; schema_version: string }) => ({
      ...placement, client,
      assertPlacementBound: options.assertPhysicalPath ?? (async () => undefined),
    })),
  };
  const resolver = createCompanyStorageResolver({
    registry,
    opener,
    scopeRevalidator: { assertCurrent: async () => undefined },
  });
  return { client, registry, opener, resolver, setRevision(value: number) { revision = value; } };
}

describe("native company-store consumer", () => {
  it("preserves the resolved company and uses only its ready physical store", async () => {
    const f = setup();
    const operation = vi.fn(async (client: StorageClient) => client.dialect);

    await expect(withNativeCompanyStore({
      resolver: f.resolver, scope, company_id: "company-a", operation,
    })).resolves.toBe("sqlite");

    expect(f.registry.findByCompanyId).toHaveBeenCalledWith("company-a", { signal: undefined });
    expect(f.opener.open).toHaveBeenCalledWith(expect.objectContaining({
      company_id: "company-a", placement_id: "opaque-company-a", placement_revision: 4,
      provider: "sqlite", schema_version: "native-fsm/1",
    }), expect.objectContaining({ assertCurrent: expect.any(Function), signal: undefined }));
    expect(operation).toHaveBeenCalledWith(f.client);
    expect(f.client.close).toHaveBeenCalledTimes(1);
  });

  it("rejects a company mismatch before any physical open", async () => {
    const f = setup();
    const operation = vi.fn();
    await expect(withNativeCompanyStore({
      resolver: f.resolver, scope, company_id: "company-b", operation,
    })).rejects.toThrow("native-company-placement-mismatch");
    expect(f.opener.open).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });

  it("fails closed without a real READY marker", async () => {
    const f = setup({ status: "PROVISIONING" });
    const operation = vi.fn();
    await expect(withNativeCompanyStore({
      resolver: f.resolver, scope, company_id: "company-a", operation,
    })).rejects.toMatchObject({ code: "placement-not-ready" } satisfies Partial<CompanyStorageResolutionError>);
    expect(f.opener.open).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
  });

  it("closes the store and rejects a physical path or restore identity mismatch", async () => {
    const f = setup({ assertPhysicalPath: async () => { throw new Error("store-path-identity-mismatch"); } });
    const operation = vi.fn();
    await expect(withNativeCompanyStore({
      resolver: f.resolver, scope, company_id: "company-a", operation,
    })).rejects.toMatchObject({ code: "company-store-binding-mismatch" });
    expect(f.client.close).toHaveBeenCalledTimes(1);
    expect(operation).not.toHaveBeenCalled();
  });

  it("rejects a stale placement revision after the operation before accepting its result", async () => {
    const f = setup();
    const operation = vi.fn(async () => {
      f.setRevision(5);
      return "unverified";
    });
    await expect(withNativeCompanyStore({
      resolver: f.resolver, scope, company_id: "company-a", operation,
    })).rejects.toMatchObject({ code: "placement-stale" });
    expect(f.client.close).toHaveBeenCalledTimes(1);
  });

  it("marks close failure after a successful callback as unsafe to retry", async () => {
    const closeError = new Error("sqlite-close-failed");
    const f = setup({ close: async () => { throw closeError; } });
    const operation = vi.fn(async () => "write-returned");

    await expect(withNativeCompanyStore({
      resolver: f.resolver, scope, company_id: "company-a", operation,
    })).rejects.toMatchObject({
      name: "NativeCompanyStoreCloseAfterOperationError",
      message: "native-company-store-close-after-operation",
      operation_returned_successfully: true,
      automatic_retry_allowed: false,
      cause: closeError,
    } satisfies Partial<NativeCompanyStoreCloseAfterOperationError>);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(f.client.close).toHaveBeenCalledTimes(1);
  });
});
