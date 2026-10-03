import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { withTenantTransaction } from "@/lib/db/portable";
import { appendAuditLog } from "@/lib/db/audit";
import { lockOwnerMembershipChanges } from "@/lib/db/owner-membership-lock";
import { logger } from "@/lib/logger";
import { getPathId } from "@/lib/route-utils";

export const dynamic = "force-dynamic";

const patchUserBody = z
  .object({
    full_name: z.string().min(1).max(255).optional(),
    email: z.string().email().max(255).optional(),
    phone: z.string().max(50).optional().or(z.literal("")),
    role: z.enum(["owner", "admin", "tech"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

// Any authenticated user can view/edit — permissions enforced inside handler.
export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = getPathId(request.nextUrl.pathname);
  const isSelf = id === session.userId;
  if (!isSelf && session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Access denied", traceId: session.traceId } },
      { status: 403 }
    );
  }
  const row = await withTenantTransaction(session, async (client, accountId) => {
    const { rows } = await client.query(
      `SELECT u.id, u.full_name, u.email, u.phone, bm.role, u.created_at
         FROM users u
         JOIN business_memberships bm
           ON bm.user_id = u.id AND bm.account_id = $2 AND bm.status = 'active'
        WHERE u.id = $1 AND u.account_id = $2`,
      [id, accountId],
    );
    return rows[0] ?? null;
  });
  if (!row) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User not found", traceId: session.traceId } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: row });
});

export const PATCH = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = getPathId(request.nextUrl.pathname);
  const isSelf = id === session.userId;

  if (!isSelf && session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Access denied", traceId: session.traceId } },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = patchUserBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request body", details: parsed.error.flatten().fieldErrors, traceId: session.traceId } },
      { status: 422 }
    );
  }

  const { full_name, email, phone, role } = parsed.data;

  // Role changes: owner only, and can't orphan the last owner.
  if (role !== undefined) {
    if (session.role !== "owner") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only owners can change roles", traceId: session.traceId } },
        { status: 403 }
      );
    }
  }

  // Non-admin techs can only edit their own name/phone (not email, not role)
  if (isSelf && session.role === "tech") {
    if (email !== undefined || role !== undefined) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Techs can only update their name and phone", traceId: session.traceId } },
        { status: 403 }
      );
    }
  }

  try {
    return await withTenantTransaction(session, async (client, accountId) => {
      if (role !== undefined) {
        await lockOwnerMembershipChanges(client, accountId);
        const actorMembership = await client.query<{ role: string }>(
          `SELECT role FROM business_memberships
            WHERE account_id = $1 AND user_id = $2 AND status = 'active'`,
          [accountId, session.userId],
        );
        if (actorMembership.rows[0]?.role !== "owner") {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "Only current company owners can change roles", traceId: session.traceId } },
            { status: 403 },
          );
        }
      }

      const before = await client.query(
        `SELECT u.id, u.full_name, u.email, u.phone, bm.role
           FROM users u
           JOIN business_memberships bm
             ON bm.user_id = u.id AND bm.account_id = $2 AND bm.status = 'active'
          WHERE u.id = $1 AND u.account_id = $2`,
        [id, accountId],
      );
      if (!before.rowCount) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found", traceId: session.traceId } }, { status: 404 });
      }

      const previousRole = (before.rows[0] as { role: string }).role;
      if (role !== undefined && previousRole === "owner" && role !== "owner") {
        const { rows: ownerRows } = await client.query<{ cnt: number }>(
          `SELECT COUNT(*)::int AS cnt FROM business_memberships
            WHERE account_id = $1 AND status = 'active' AND role = 'owner'`,
          [accountId],
        );
        if ((ownerRows[0]?.cnt ?? 0) <= 1) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "Cannot remove the last owner", traceId: session.traceId } },
            { status: 422 },
          );
        }
      }

      const setClauses: string[] = ["updated_at = now()"];
      const params: unknown[] = [];
      let idx = 1;

      if (full_name !== undefined) { setClauses.push(`full_name = $${idx++}`); params.push(full_name); }
      if (email !== undefined) { setClauses.push(`email = $${idx++}`); params.push(email.toLowerCase().trim()); }
      if (phone !== undefined) { setClauses.push(`phone = $${idx++}`); params.push(phone || null); }
      if (role !== undefined) {
        // Legacy projection for users.account_id only. Sessions use the
        // selected-company membership as their authority.
        setClauses.push(`role = $${idx++}`);
        params.push(role);
      }
      params.push(id);

      const { rows } = await client.query(
        `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${idx} AND account_id = $${idx + 1} RETURNING id, full_name, email, phone`,
        [...params, accountId],
      );

      if (role !== undefined) {
        // Roles belong to the selected company membership, not the global principal.
        const membershipUpdate = await client.query(
          `UPDATE business_memberships SET role = $1, updated_at = now()
            WHERE user_id = $2 AND account_id = $3 AND status = 'active'`,
          [role, id, accountId],
        );
        if (membershipUpdate.rowCount !== 1) throw new Error("Active membership disappeared during role update");
      }

      const updated = { ...rows[0], role: role ?? (before.rows[0] as { role: string }).role };

      await appendAuditLog(client, {
        account_id: accountId,
        entity_type: "user",
        entity_id: id,
        action: "update",
        actor_id: session.userId,
        trace_id: session.traceId,
        old_value: before.rows[0] as Record<string, unknown>,
        new_value: updated,
      });
      return NextResponse.json({ data: updated });
    });
  } catch (error) {
    logger.error("PATCH /api/v1/users/[id] error", error, { traceId: session.traceId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update user", traceId: session.traceId } },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, session: AuthSession) => {
  const id = getPathId(request.nextUrl.pathname);

  if (session.role !== "owner") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Only owners can remove team members", traceId: session.traceId } },
      { status: 403 }
    );
  }
  if (id === session.userId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "You cannot remove your own account", traceId: session.traceId } },
      { status: 422 }
    );
  }

  try {
    return await withTenantTransaction(session, async (client, accountId) => {
      await lockOwnerMembershipChanges(client, accountId);
      const actorMembership = await client.query<{ role: string }>(
        `SELECT role FROM business_memberships
          WHERE account_id = $1 AND user_id = $2 AND status = 'active'`,
        [accountId, session.userId],
      );
      if (actorMembership.rows[0]?.role !== "owner") {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Only current company owners can remove team members", traceId: session.traceId } },
          { status: 403 },
        );
      }

      const before = await client.query(
        `SELECT u.id, u.full_name, u.email, bm.role, bm.status, bm.id AS membership_id
           FROM users u
           JOIN business_memberships bm
             ON bm.user_id = u.id AND bm.account_id = $2
          WHERE u.id = $1 AND u.account_id = $2 AND bm.status <> 'revoked'`,
        [id, accountId],
      );
      if (!before.rowCount) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found", traceId: session.traceId } }, { status: 404 });
      }

      const target = before.rows[0] as { role: string; status: string; membership_id: string };
      if (target.role === "owner" && target.status === "active") {
        const { rows } = await client.query<{ cnt: number }>(
          `SELECT COUNT(*)::int AS cnt FROM business_memberships
            WHERE account_id = $1 AND status = 'active' AND role = 'owner'`,
          [accountId],
        );
        if ((rows[0]?.cnt ?? 0) <= 1) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "Cannot remove the last owner", traceId: session.traceId } },
            { status: 422 },
          );
        }
      }

      await client.query(
        `UPDATE business_memberships SET status = 'revoked', updated_at = now()
          WHERE account_id = $1 AND user_id = $2 AND status <> 'revoked'`,
        [accountId, id],
      );
      // Keep account_id-scoped legacy consumers from seeing a removed owner.
      // This is constrained to the user's primary account; other memberships
      // and their role authority are untouched.
      await client.query(
        `UPDATE users SET role = 'tech', updated_at = now()
          WHERE id = $1 AND account_id = $2`,
        [id, accountId],
      );

      await appendAuditLog(client, {
        account_id: accountId,
        entity_type: "business_membership",
        entity_id: target.membership_id,
        action: "delete",
        actor_id: session.userId,
        trace_id: session.traceId,
        old_value: before.rows[0] as Record<string, unknown>,
        new_value: null,
      });
      return NextResponse.json({ deleted: true, membership_revoked: true });
    });
  } catch (error: unknown) {
    logger.error("DELETE /api/v1/users/[id] error", error, { traceId: session.traceId });
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to remove user", traceId: session.traceId } },
      { status: 500 }
    );
  }
});
