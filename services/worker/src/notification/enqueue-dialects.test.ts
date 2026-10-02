import { describe, expect, it, vi } from "vitest";
import { enqueueNotification } from "./enqueue.js";
import type { DatabaseClient } from "../db-client.js";
const opts={accountId:"company-a",clientId:null,automationType:"test",priority:10,toAddress:"test@example.invalid",subject:"Test",htmlBody:"Test",idempotencyKey:"key",cancelOnEvents:["visit.cancelled"]};
describe("notification enqueue dialect bindings",()=>{
  it("PostgreSQL cancellation events use the native array binding and conditional same-company upsert",async()=>{
    const query=vi.fn(async(_sql:string,_params?:unknown[])=>({rows:[],rowCount:1}));
    await enqueueNotification({dialect:"postgres",query} as DatabaseClient,opts);
    const [sql,params]=query.mock.calls[1];
    expect(params?.[10]).toEqual(["visit.cancelled"]);
    expect(sql).toContain("WHERE notification_queue.account_id=excluded.account_id");
    expect(sql).toContain("notification_queue.status='failed'");
    expect(sql).not.toContain("attempt_count = 0");
  });
  it("MySQL uses JSON and guarded duplicate-key assignments instead of PostgreSQL conflict syntax",async()=>{
    const query=vi.fn(async(_sql:string,_params?:unknown[])=>({rows:[],rowCount:1}));
    await enqueueNotification({dialect:"mysql",query} as DatabaseClient,opts);
    const [sql,params]=query.mock.calls[1];
    expect(params?.[10]).toBe('["visit.cancelled"]');
    expect(params?.[11]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
    expect(sql).toContain("ON DUPLICATE KEY UPDATE");expect(sql).not.toContain("ON CONFLICT");
    expect(sql).toContain("account_id=VALUES(account_id) AND status='failed'");
    expect(sql).toContain("attempt_count < max_attempts");
  });
  it("MySQL FOUND_ROWS cannot turn a guarded no-op into a successful enqueue",async()=>{
    const query=vi.fn().mockResolvedValueOnce({rows:[],rowCount:0})
      .mockResolvedValueOnce({rows:[],rowCount:1})
      .mockResolvedValueOnce({rows:[{account_id:"company-a",status:"dead_letter"}],rowCount:1});
    expect(await enqueueNotification({dialect:"mysql",query} as DatabaseClient,opts)).toBe("duplicate");
  });
});
