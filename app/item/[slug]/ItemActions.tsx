"use client";

import { useState } from "react";

export default function ItemActions({
  slug,
  initialQuantity,
}: {
  slug: string;
  initialQuantity: number;
}) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(change: 1 | -1) {
    if (busy) return;
    setError(null);

    setBusy(true);
    try {
      const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, change }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        /* empty/non-JSON body — handled below */
      }

      if (!res.ok) {
        if (typeof data.quantity === "number") setQuantity(data.quantity);
        setError(data.error || "Something went wrong.");
        return;
      }
      setQuantity(data.quantity);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <p className="muted" style={{ textAlign: "center", margin: 0 }}>
        Current quantity
      </p>
      <div className="qty">{quantity}</div>

      <div style={{ marginBottom: 12 }}>
        <button
          className="btn btn-big btn-green"
          onClick={() => move(1)}
          disabled={busy}
        >
          + Add 1
        </button>
      </div>
      <button
        className="btn btn-big btn-take"
        onClick={() => move(-1)}
        disabled={busy || quantity <= 0}
      >
        − Take away 1
      </button>

      {error ? (
        <p className="error" style={{ textAlign: "center" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
