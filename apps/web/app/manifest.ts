import type { MetadataRoute } from "next";

/**
 * Base web-app metadata for the owner/browser experience.
 *
 * This is intentionally NOT an installable Command PWA identity. Provisionable
 * install identities are exposed only when their authenticated route exists.
 * Go is currently provisionable; Hub remains reserved until a customer-auth
 * boundary and real /hub entry route are implemented.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Titan Zero",
    short_name: "Titan Zero",
    description: "Titan Zero — managed Advanced Intelligence and AI workforce for business.",
    start_url: "/app/command",
    scope: "/",
    display: "browser",
    background_color: "#07090d",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
