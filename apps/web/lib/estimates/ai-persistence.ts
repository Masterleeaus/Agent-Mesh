import type { DbClient } from "@/lib/db-contract";
import { randomUUID } from "node:crypto";
import type { EstimateAiResult } from "./ai-provider";

export async function persistEstimateAiRun(
  client: DbClient,
  input: { accountId:string; estimateId:string; request:unknown; result:EstimateAiResult; createdBy:string }
): Promise<string> {
  const id=randomUUID();
  await client.query(
    `INSERT INTO estimate_ai_runs
      (id, account_id, estimate_id, provider, model, request_json, response_json, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id,input.accountId,input.estimateId,input.result.provider,input.result.model,
     JSON.stringify(input.request),JSON.stringify(input.result.output),input.createdBy]
  );
  return id;
}
