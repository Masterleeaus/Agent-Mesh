import { createHash } from "node:crypto";
import { buildDistributionCoverageSnapshot } from "../packages/titan-platform/.test-dist/distribution-catalog.js";

const coverage = buildDistributionCoverageSnapshot();
const canonicalPayload = JSON.stringify(coverage);
const document = {
  schema: "titan.distribution-coverage-artifact/v1",
  source_commit: process.env.GITHUB_SHA ?? null,
  payload_sha256: createHash("sha256").update(canonicalPayload).digest("hex"),
  coverage,
};

process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
