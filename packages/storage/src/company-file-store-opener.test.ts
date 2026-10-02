import { chmod, mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalCompanyFileStoreOpener } from "./company-file-store-opener.js";
import type { CompanyFilePlacementRecord } from "./company-placement-registry.js";

const directories: string[] = [];

async function makeRoot(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "titan-company-files-"));
  await chmod(path, 0o700);
  directories.push(path);
  return path;
}

function placement(companyId: string, filePlacementId: string): CompanyFilePlacementRecord {
  return Object.freeze({
    company_id: companyId,
    file_placement_id: filePlacementId,
    file_placement_revision: 1,
    provider: "localfs",
    schema_version: "localfs/1",
    status: "READY",
  });
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe("registry-selected company file store", () => {
  it("keeps identical object keys isolated by opaque company placement", async () => {
    const root = await makeRoot();
    await mkdir(join(root, "placement-a"), { mode: 0o700 });
    await mkdir(join(root, "placement-b"), { mode: 0o700 });
    const opener = createLocalCompanyFileStoreOpener({ companyFileStoreRoot: root });
    const [a, b] = await Promise.all([
      opener.open(placement("company-a", "placement-a")),
      opener.open(placement("company-b", "placement-b")),
    ]);

    await a.putObject("evidence-1", new TextEncoder().encode("company A"));
    await b.putObject("evidence-1", new TextEncoder().encode("company B"));
    expect(new TextDecoder().decode(await a.readObject("evidence-1"))).toBe("company A");
    expect(new TextDecoder().decode(await b.readObject("evidence-1"))).toBe("company B");
  });

  it("rejects paths, overwrites, unready placements, and symlinked namespaces or objects", async () => {
    const root = await makeRoot();
    await mkdir(join(root, "placement-a"), { mode: 0o700 });
    const opener = createLocalCompanyFileStoreOpener({ companyFileStoreRoot: root });
    const store = await opener.open(placement("company-a", "placement-a"));

    for (const key of ["../company-b", "nested/object", ".", ""]) {
      await expect(store.readObject(key)).rejects.toThrow();
    }
    await store.putObject("object-1", new Uint8Array([1, 2, 3]));
    await expect(store.putObject("object-1", new Uint8Array([4]))).rejects.toThrow();
    await symlink(join(root, "outside"), join(root, "placement-a", "linked-object"));
    await expect(store.readObject("linked-object")).rejects.toThrow();
    await expect(opener.open({ ...placement("company-a", "placement-a"), status: "PROVISIONING" }))
      .rejects.toThrow();

    const outsideRoot = join(root, "outside-root");
    await mkdir(outsideRoot, { mode: 0o700 });
    await symlink(outsideRoot, join(root, "placement-link"));
    await expect(opener.open(placement("company-a", "placement-link"))).rejects.toThrow();
  });

  it("rejects world-writable roots and namespace directories", async () => {
    const root = await makeRoot();
    await mkdir(join(root, "placement-a"), { mode: 0o700 });
    const opener = createLocalCompanyFileStoreOpener({ companyFileStoreRoot: root });
    await chmod(root, 0o777);
    await expect(opener.open(placement("company-a", "placement-a"))).rejects.toThrow();

    const secondRoot = await makeRoot();
    await mkdir(join(secondRoot, "placement-b"), { mode: 0o700 });
    await chmod(join(secondRoot, "placement-b"), 0o777);
    const secondOpener = createLocalCompanyFileStoreOpener({ companyFileStoreRoot: secondRoot });
    await expect(secondOpener.open(placement("company-b", "placement-b"))).rejects.toThrow();
  });
});
