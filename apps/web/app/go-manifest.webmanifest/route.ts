import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "Titan Go",
    short_name: "Go",
    description: "Titan Zero field workspace.",
    start_url: "/app/go",
    scope: "/app/",
    id: "/app/go",
    display: "standalone",
    background_color: "#07090d",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }, { headers: { "content-type": "application/manifest+json" } });
}
