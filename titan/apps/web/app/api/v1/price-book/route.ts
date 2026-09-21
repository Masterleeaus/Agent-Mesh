import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { listPriceBook } from "@/lib/pricing/price-book-repository";
import { logger } from "@/lib/logger";
import { priceBookCategorySchema, priceBookTierSchema } from "@ai-fsm/domain";

export const dynamic = "force-dynamic";

const listQuerySchema = z.object({
  category: priceBookCategorySchema.optional(),
  tier: priceBookTierSchema.optional(),
  search: z.string().max(200).optional(),
  active_only: z.enum(["true", "false"]).default("true"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

// GET /api/v1/price-book — list services with optional filters
export const GET = withAuth(async (request: NextRequest, session: AuthSession) => {
  const { searchParams } = new URL(request.url);
  const parseResult = listQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    tier: searchParams.get("tier") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    active_only: searchParams.get("active_only") ?? "true",
    limit: searchParams.get("limit") ?? "100",
  });

  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: { issues: parseResult.error.issues },
          traceId: session.traceId,
        },
      },
      { status: 400 }
    );
  }

  const { category, tier, search, active_only, limit } = parseResult.data;

  try {
    const rows = await listPriceBook({
      category,
      tier,
      search,
      activeOnly: active_only === "true",
      limit,
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    logger.error("[price-book GET]", error, { traceId: session.traceId });
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch price book",
          traceId: session.traceId,
        },
      },
      { status: 500 }
    );
  }
});
