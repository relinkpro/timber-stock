"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// Build the absolute URL a QR code should point to: <site>/item/<slug>.
// Prefers NEXT_PUBLIC_SITE_URL, falls back to the current browser origin.
function itemUrl(slug: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const base =
    fromEnv ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/item/${slug}`;
}

export default function QrCode({
  slug,
  size = 96,
}: {
  slug: string;
  size?: number;
}) {
  // Render only after mount so the browser-origin fallback is correct.
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    setUrl(itemUrl(slug));
  }, [slug]);

  if (!url) {
    return <div style={{ width: size, height: size }} aria-hidden />;
  }
  return <QRCodeSVG value={url} size={size} level="M" includeMargin />;
}
