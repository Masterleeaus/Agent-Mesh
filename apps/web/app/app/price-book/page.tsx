import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listPriceBook } from "@/lib/pricing/price-book-repository";
import PriceBookClient from "./PriceBookClient";

export const dynamic = "force-dynamic";

export default async function PriceBookPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "tech") redirect("/app/my-work"); // EPIC-006: techs have no pricing access

  const services = await listPriceBook({ activeOnly: false, limit: 200 });

  return <PriceBookClient services={services} />;
}
