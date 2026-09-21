import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { ServiceWorkerRegistrar } from "./ServiceWorkerRegistrar";

// Archivo — matches the Dovetails marketing site (mydovetails-site uses
// 'Archivo Variable'). Exposed as --font-archivo; tokens.css --font-sans
// consumes it with a system fallback so an offline build still renders.
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Titan Business Ops",
  description: "Titan Business Ops — standalone field service and business operations",
  appleWebApp: {
    capable: true,
    title: "Titan Business Ops",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Browser chrome / PWA status bar — burnt-orange brand, not legacy slate.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#c1540f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
