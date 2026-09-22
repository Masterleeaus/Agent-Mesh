import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthenticatedSurfaceProjection,
  surfaceForSessionRole,
} from "./authenticated-surface";

test("owner and admin sessions normalize to canonical zero", () => {
  assert.equal(surfaceForSessionRole("owner"), "zero");
  assert.equal(surfaceForSessionRole("admin"), "zero");
});

test("tech sessions normalize to canonical go", () => {
  assert.equal(surfaceForSessionRole("tech"), "go");
});

test("session account is the canonical company boundary", () => {
  const projection = createAuthenticatedSurfaceProjection(
    { userId: "user-1", accountId: "company-1", role: "owner" },
    {
      issued_at: "2026-09-22T08:00:00.000Z",
      expires_at: "2099-09-22T08:05:00.000Z",
    },
  );
  assert.equal(projection.company_id, "company-1");
  assert.equal(projection.actor_id, "user-1");
  assert.equal(projection.surface, "zero");
  assert.equal(projection.identity_grants_authority, false);
});

test("session role cannot self-select another canonical surface", () => {
  assert.throws(
    () =>
      createAuthenticatedSurfaceProjection(
        { userId: "user-1", accountId: "company-1", role: "tech" },
        {
          surface: "zero",
          issued_at: "2026-09-22T08:00:00.000Z",
          expires_at: "2099-09-22T08:05:00.000Z",
        },
      ),
    /session-surface-not-authorised/,
  );
});


test("Hub cannot be derived from a staff authentication session", () => {
  assert.throws(() => createAuthenticatedHubSurfaceProjection(), /hub-requires-customer-auth-boundary/);
});
