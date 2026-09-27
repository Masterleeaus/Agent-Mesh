import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Titan Zero | Protect Every Service Promise",
  description: "Automotive service operations intelligence that recovers repair orders from capacity disruptions with human approval and auditable execution.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
