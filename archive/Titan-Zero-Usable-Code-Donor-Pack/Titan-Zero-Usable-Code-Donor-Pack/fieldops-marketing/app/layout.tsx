import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldOps AI | Protect Every Service Promise",
  description: "An AI-orchestrated dealership service operations system that recovers repair orders from capacity disruptions with human approval and auditable execution.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
