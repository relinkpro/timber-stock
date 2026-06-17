"use client";

import { useRef, useState } from "react";
import { ensurePin, clearStoredPin } from "@/app/components/pinClient";
import type { InventoryItem } from "@/lib/supabase";

// A single button that opens the phone camera or photo library, uploads the
// chosen image, and reports the updated item back. Requires the admin PIN.
export default function PhotoUpload({
  itemId,
  hasImage,
  onUploaded,
  className = "btn",
}: {
  itemId: string;
  hasImage: boolean;
  onUploaded?: (item: InventoryItem) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;

    const pin = ensurePin();
    if (!pin) return;

    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("pin", pin);
      fd.append("file", file);

      const res = await fetch(`/api/items/${itemId}/image`, {
        method: "POST",
        body: fd,
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        /* empty body — handled by !res.ok below */
      }

      if (!res.ok) {
        if (res.status === 401) clearStoredPin();
        throw new Error(data.error || "Upload failed.");
      }
      onUploaded?.(data.item as InventoryItem);
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : hasImage ? "📷 Change photo" : "📷 Add photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onPick}
      />
      {error ? <p className="error">{error}</p> : null}
    </>
  );
}
