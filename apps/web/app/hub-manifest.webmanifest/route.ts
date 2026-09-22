import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "Titan Hub",
    short_name: "Hub",
    description: "Titan Zero customer workspace.",
    start_url: "/hub",
    scope: "/hub",
    display: "standalone",
    background_color: "#07090d",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, { headers: { "content-type": "application/manifest+json" } });
}
