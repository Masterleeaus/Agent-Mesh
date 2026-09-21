import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLDWRK — AI-native field service for the trades",
  description:
    "Run your plumbing, HVAC, or electrical business from your truck. Voice-first. AI-powered. No laptop required.",
  openGraph: {
    title: "FLDWRK — AI-native field service for the trades",
    description:
      "Voice-first job management for plumbers, HVAC techs, and electricians. Dictate notes, get AI quotes, track your truck — all hands-free.",
    type: "website",
    url: "https://fldwrk.ai",
    images: [{ url: "https://fldwrk.ai/favicon-512x512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FLDWRK — AI-native field service for the trades",
    description:
      "Voice-first job management for plumbers, HVAC techs, and electricians.",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicon-180x180.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* FLDWRK Brand Font: Space Grotesk */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
