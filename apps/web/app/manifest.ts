import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest). Next automatically emits
// the <link rel="manifest"> into <head> because this metadata route exists.
// Kept intentionally minimal — installability only, no caching/offline scope.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Titan Business Ops",
    short_name: "Titan Ops",
    lang: "en-AU",
    dir: "ltr",
    description: "Titan Business Ops — standalone field service and business operations",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    categories: ["business", "productivity"],
    // Match Cedar & Clay rebrand (booking + login accent #c1540f), not legacy slate.
    background_color: "#fafaf9",
    theme_color: "#c1540f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Capture",
        short_name: "Capture",
        description: "Record a customer promise",
        url: "/app/capture",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
