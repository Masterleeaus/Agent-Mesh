import { describe, expect, it, vi } from "vitest";
import { ZeroWorkforceDispatcher } from "./workforce-dispatcher";

const input = {
  company_id: "company-1",
  actor_id: "one-1",
  conversation_id: "conversation-1",
  interaction_id: "interaction-1",
  client_message_id: "message-1",
  text: "Emma is sick tomorrow. Sort it out.",
  correlation_id: "correlation-1",
};

describe("ZeroWorkforceDispatcher", () => {
  it("creates canonical company-scoped work instead of executing directly", async () => {
    const create = vi.fn(async (work) => ({ ...work, state: "READY", created_at: "now", updated_at: "now", context_refs: [], evidence_refs: [] }));
    const workforce = { create, resume: vi.fn() } as any;
    const dispatcher = new ZeroWorkforceDispatcher(workforce, () => "dispatch-agent");

    const result = await dispatcher.dispatch(input);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      company_id: "company-1",
      creator: "one-1",
      assignee: "dispatch-agent",
      objective: input.text,
      origin: expect.objectContaining({
        conversation_id: "conversation-1",
        surface: "zero",
        correlation_id: "correlation-1",
      }),
    }));
    expect(result.continuation_token).toBe("zero:interaction-1");
    expect(result.events[0]).toMatchObject({ kind: "work.accepted", company_id: "company-1", conversation_id: "conversation-1" });
  });

  it("resumes the existing WorkItem when a continuation token is supplied", async () => {
    const resume = vi.fn(async (company_id, work_id) => ({ company_id, work_id, state: "READY", assignee: "dispatch-agent" }));
    const workforce = { create: vi.fn(), resume } as any;
    const dispatcher = new ZeroWorkforceDispatcher(workforce, () => "dispatch-agent");

    const result = await dispatcher.dispatch({ ...input, continuation_token: "work-existing", requested_agent_id: "dispatch-agent" });

    expect(resume).toHaveBeenCalledWith("company-1", "work-existing", "one-1");
    expect(workforce.create).not.toHaveBeenCalled();
    expect(result.continuation_token).toBe("work-existing");
  });
});
