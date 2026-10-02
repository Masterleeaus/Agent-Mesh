import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { cookies } from "next/headers";
import { roleSchema, type Role } from "@titan-zero/domain";
import { portableQueryOne } from "../db/portable";
import { getDatabaseDialect } from "../db/dialect";
import { getEnv } from "../env";

const COOKIE_NAME = "fsm_session";
const EXPIRY = "7d";

export interface SessionPayload {
  userId: string;
  accountId: string;
  role: Role;
}

// These remain opaque IDs: SQLite compatibility IDs need not be UUIDs.
// Reject ambiguous/empty/control-character context before any identity query.
const identityId = z.string().min(1).refine(
  (value) => value === value.trim() && !/[\u0000-\u001f\u007f]/.test(value),
);
const sessionPayloadSchema = z.object({
  userId: identityId,
  accountId: identityId,
  role: roleSchema,
});

type UserSessionRow = {
  id: string;
  account_id: string;
  role: string;
  [key: string]: unknown;
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      requiredClaims: ["exp", "iat"],
    });
    const parsed = sessionPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const verified = await verifySession(token);
  if (!verified) return null;

  const user = await portableQueryOne<UserSessionRow>(
    getDatabaseDialect() === "sqlite"
      ? `SELECT id, company_id AS account_id, role FROM users WHERE id=$1 AND company_id=$2`
      : `SELECT u.id,
            m.account_id,
            m.role
       FROM users u
       JOIN business_memberships m
         ON m.user_id = u.id
        AND m.account_id = $2
        AND m.status = 'active'
      WHERE u.id = $1`,
    [verified.userId, verified.accountId],
  );
  // No users.account_id/role fallback: a deleted or revoked membership must
  // never recreate company access. Missing legacy memberships require explicit
  // recovery; new PostgreSQL users create their membership transactionally.
  if (!user || user.id !== verified.userId || user.account_id !== verified.accountId) return null;

  const role = roleSchema.safeParse(user.role);
  if (!role.success) return null;

  return {
    userId: user.id,
    accountId: user.account_id,
    role: role.data,
  };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES !== "false" && process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
