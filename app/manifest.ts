import type { MetadataRoute } from "next";

// Served by Next at /manifest.webmanifest, and the <link rel="manifest">
// tag is injected automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Timber Stock",
    short_name: "Stock",
    description: "Scan a QR code and tap Add 1 or Take away 1.",
    start_url: "/admin/items",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
