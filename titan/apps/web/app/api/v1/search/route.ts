import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import type { AuthSession } from "@/lib/auth/middleware";
import { withTenantTransaction } from "@/lib/db/portable";

export const dynamic = "force-dynamic";

type SearchResult = {
  type: "client" | "property" | "job" | "estimate" | "invoice" | "request";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

type SearchRow = { id: string; title: string; subtitle: string | null };

export const GET = withRole(["owner", "admin"], async (request: NextRequest, session: AuthSession) => {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ data: [] });
  const like = `%${q}%`;

  const data = await withTenantTransaction(session, async (client, accountId) => {
    const [clients, properties, jobs, estimates, invoices, requests] = await Promise.all([
      client.query<SearchRow>(
        `SELECT c.id, c.name AS title,
                COALESCE(NULLIF(c.company_name, ''), NULLIF(c.email, ''), NULLIF(c.phone, '')) AS subtitle
         FROM clients c
         WHERE c.account_id = $1
           AND (LOWER(c.name) LIKE $2 OR LOWER(COALESCE(c.company_name, '')) LIKE $2
             OR LOWER(COALESCE(c.email, '')) LIKE $2 OR LOWER(COALESCE(c.phone, '')) LIKE $2)
         ORDER BY c.name ASC LIMIT 8`,
        [accountId, like],
      ),
      client.query<SearchRow>(
        `SELECT p.id, COALESCE(NULLIF(p.nickname, ''), p.address_line1) AS title,
                c.name AS subtitle
         FROM properties p
         JOIN clients c ON c.id = p.client_id AND c.account_id = p.account_id
         WHERE p.account_id = $1
           AND (LOWER(COALESCE(p.nickname, '')) LIKE $2 OR LOWER(COALESCE(p.address_line1, '')) LIKE $2
             OR LOWER(COALESCE(p.city, '')) LIKE $2 OR LOWER(c.name) LIKE $2)
         ORDER BY c.name ASC LIMIT 8`,
        [accountId, like],
      ),
      client.query<SearchRow>(
        `SELECT j.id, COALESCE(NULLIF(j.title, ''), 'Job') AS title,
                CONCAT(c.name, CASE WHEN j.job_number IS NULL OR j.job_number = '' THEN '' ELSE CONCAT(' · ', j.job_number) END) AS subtitle
         FROM jobs j
         JOIN clients c ON c.id = j.client_id AND c.account_id = j.account_id
         WHERE j.account_id = $1
           AND (LOWER(COALESCE(j.title, '')) LIKE $2 OR LOWER(COALESCE(j.job_number, '')) LIKE $2 OR LOWER(c.name) LIKE $2)
         ORDER BY j.updated_at DESC LIMIT 8`,
        [accountId, like],
      ),
      client.query<SearchRow>(
        `SELECT e.id, COALESCE(e.estimate_number, 'Estimate') AS title, c.name AS subtitle
         FROM estimates e JOIN clients c ON c.id = e.client_id AND c.account_id = e.account_id
         WHERE e.account_id = $1
           AND (LOWER(COALESCE(e.estimate_number, '')) LIKE $2 OR LOWER(c.name) LIKE $2)
         ORDER BY e.updated_at DESC LIMIT 8`,
        [accountId, like],
      ),
      client.query<SearchRow>(
        `SELECT i.id, i.invoice_number AS title, c.name AS subtitle
         FROM invoices i JOIN clients c ON c.id = i.client_id AND c.account_id = i.account_id
         WHERE i.account_id = $1
           AND (LOWER(COALESCE(i.invoice_number, '')) LIKE $2 OR LOWER(c.name) LIKE $2)
         ORDER BY i.created_at DESC LIMIT 8`,
        [accountId, like],
      ),
      client.query<SearchRow>(
        `SELECT br.id, COALESCE(NULLIF(br.service_description, ''), 'Request') AS title,
                COALESCE(c.name, br.name) AS subtitle
         FROM booking_requests br
         LEFT JOIN clients c ON c.id = br.client_id AND c.account_id = br.account_id
         WHERE br.account_id = $1
           AND (LOWER(COALESCE(br.name, '')) LIKE $2 OR LOWER(COALESCE(c.name, '')) LIKE $2
             OR LOWER(COALESCE(br.service_description, '')) LIKE $2)
         ORDER BY br.created_at DESC LIMIT 8`,
        [accountId, like],
      ),
    ]);

    const map = (type: SearchResult["type"], hrefBase: string, rows: SearchRow[]): SearchResult[] =>
      rows.map((row) => ({ type, id: row.id, title: row.title, subtitle: row.subtitle, href: `${hrefBase}/${row.id}` }));

    return [
      ...map("client", "/app/clients", clients.rows),
      ...map("property", "/app/properties", properties.rows),
      ...map("job", "/app/jobs", jobs.rows),
      ...map("estimate", "/app/estimates", estimates.rows),
      ...map("invoice", "/app/invoices", invoices.rows),
      ...map("request", "/app/requests", requests.rows),
    ].slice(0, 30);
  });

  return NextResponse.json({ data });
});
