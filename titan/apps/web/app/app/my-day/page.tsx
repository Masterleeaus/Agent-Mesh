import { redirect } from "next/navigation";
import { standaloneCompatibilityTarget } from "@/lib/navigation/compatibility-routes";

export default function MyDayRedirect() {
  redirect(standaloneCompatibilityTarget("/app/my-day") ?? "/app/my-work");
}
