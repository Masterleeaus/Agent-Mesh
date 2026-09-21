/**
 * DELETE /api/v1/visits/[id]/media/[mediaId] — delete a media record and file
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { withAuth } from "../../../../../../../lib/auth/middleware";
import type { AuthSession } from "../../../../../../../lib/auth/middleware";
import { queryOne } from "../../../../../../../lib/db";
import { withPortableTransaction } from "@/lib/db/portable";
import { logger } from "../../../../../../../lib/logger";

export const dynamic = "force-dynamic";

export const DELETE = withAuth(
  async (request: NextRequest, session: AuthSession) => {
    // Owner/admin only
    if (session.role === "tech") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only owner or admin can delete media", traceId: session.traceId } },
        { status: 403 }
      );
    }

    const visitId = request.url.match(/\/visits\/([^/]+)\/media/)?.[1];
    const mediaId = request.url.match(/\/media\/([^/]+)(?:\/|$)/)?.[1];

    if (!visitId || !mediaId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Media not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    // Verify visit ownership
    const visit = await queryOne(
      `SELECT id FROM visits WHERE id = $1 AND account_id = $2`,
      [visitId, session.accountId]
    );
    if (!visit) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Visit not found", traceId: session.traceId } },
        { status: 404 }
      );
    }

    try {
      const filename = await withPortableTransaction(async (client) => {
        const existing = await client.query<{ filename: string }>(`SELECT filename FROM visit_media WHERE id = $1 AND visit_id = $2 AND account_id = $3`, [mediaId, visitId, session.accountId]);
        if (!existing.rows[0]) return null;
        await client.query(`DELETE FROM visit_media WHERE id = $1 AND visit_id = $2 AND account_id = $3`, [mediaId, visitId, session.accountId]);
        return existing.rows[0].filename;
      });
      if (!filename) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Media not found", traceId: session.traceId } }, { status: 404 });
      const filePath = path.join("/app/uploads/visits", visitId, filename);
      try { fs.unlinkSync(filePath); } catch (err) { logger.warn("[media DELETE] file not found on disk", { filePath, err }); }
      return NextResponse.json({ data: { deleted: true } });
    } catch (err) {
      logger.error("[media DELETE]", err, { traceId: session.traceId });
      return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete media", traceId: session.traceId } }, { status: 500 });
    }
  }
);
