import type { DatabaseDialect } from "@/lib/db-contract";
import { getDatabaseDialect, query } from "@/lib/db";

export type PriceBookListFilters = {
  category?: string;
  tier?: string;
  search?: string;
  activeOnly?: boolean;
  limit?: number;
};

export type PriceBookRow = Record<string, unknown> & {
  id: string;
  code: string;
  name: string;
  category: string;
  tier: string;
  price_min_cents: number;
  price_max_cents: number | null;
  default_price_cents: number | null;
  add_on_price_cents: number | null;
  unit_type: string | null;
  description: string | null;
  notes: string | null;
  default_labor_hours: number | null;
  requires_materials: boolean;
  upsell_codes: string[] | string | null;
  is_active: boolean;
  default_trip_count: number;
  return_trip_required: boolean;
  material_inclusion: "none_needed" | "customer_supplied" | "tech_supplied_included" | "billed_separately";
  risk_flags: string[] | string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function placeholder(dialect: DatabaseDialect, index: number): string {
  return dialect === "postgres" ? `$${index}` : "?";
}

export function buildPriceBookListQuery(dialect: DatabaseDialect, filters: PriceBookListFilters = {}) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const add = (value: unknown) => {
    params.push(value);
    return placeholder(dialect, params.length);
  };

  if (filters.category) conditions.push(`category = ${add(filters.category)}`);
  if (filters.tier) conditions.push(`tier = ${add(filters.tier)}`);
  if (filters.activeOnly) conditions.push(`is_active = ${add(true)}`);
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    const code = add(pattern);
    const name = dialect === "postgres" ? code : add(pattern);
    const description = dialect === "postgres" ? code : add(pattern);
    conditions.push(`(LOWER(code) LIKE LOWER(${code}) OR LOWER(name) LIKE LOWER(${name}) OR LOWER(description) LIKE LOWER(${description}))`);
  }

  const limit = Math.max(1, Math.min(filters.limit ?? 100, 200));
  const limitPlaceholder = add(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return {
    sql: `SELECT id, code, name, category, tier, price_min_cents, price_max_cents,
                 default_price_cents, add_on_price_cents, unit_type,
                 description, notes, default_labor_hours, requires_materials,
                 upsell_codes, is_active,
                 default_trip_count, return_trip_required, material_inclusion,
                 risk_flags, created_at, updated_at
          FROM price_book
          ${where}
          ORDER BY code ASC
          LIMIT ${limitPlaceholder}`,
    params,
  };
}

function stringArray(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    if (value.startsWith("{") && value.endsWith("}")) {
      return value.slice(1, -1).split(",").map((item) => item.replace(/^"|"$/g, "")).filter(Boolean);
    }
  }
  return [];
}

export async function listPriceBook(filters: PriceBookListFilters = {}) {
  const built = buildPriceBookListQuery(getDatabaseDialect(), filters);
  const rows = await query<PriceBookRow>(built.sql, built.params);
  return rows.map((row) => ({
    ...row,
    upsell_codes: stringArray(row.upsell_codes),
    risk_flags: stringArray(row.risk_flags),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }));
}
