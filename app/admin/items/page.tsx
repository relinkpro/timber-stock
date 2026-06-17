"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import QrCode from "@/app/components/QrCode";
import PhotoUpload from "@/app/components/PhotoUpload";
import BrandHeader from "@/app/components/BrandHeader";
import TrailerMotif from "@/app/components/TrailerMotif";
import type { InventoryItem } from "@/lib/supabase";

// Parse a response as JSON without throwing on an empty/non-JSON body.
async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

type FormState = {
  name: string;
  description: string;
  location: string;
  quantity: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  location: "",
  quantity: "0",
};

// Quantity badge colour: red (low) / amber (mid) / green (healthy).
function qtyClass(q: number): string {
  if (q <= 20) return "qty-low";
  if (q <= 40) return "qty-mid";
  return "qty-high";
}

export default function AdminItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(true);

  // Keyword filter: every typed word must appear somewhere in the product's
  // name, description or location (case-insensitive).
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = items.filter((item) => {
    if (!showArchived && item.archived) return false;
    if (terms.length === 0) return true;
    const haystack = [item.name, item.description, item.location]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/items");
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setItems(data.items as InventoryItem[]);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Shared request helper.
  async function send(url: string, method: string, body: object) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }

  async function addProduct() {
    if (!addForm.name.trim()) {
      setError("Product name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await send("/api/items", "POST", {
        name: addForm.name,
        description: addForm.description,
        location: addForm.location,
        quantity: Number(addForm.quantity) || 0,
      });
      setAddForm(emptyForm);
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      location: item.location ?? "",
      quantity: String(item.quantity),
    });
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);
    try {
      await send(`/api/items/${id}`, "PATCH", {
        name: editForm.name,
        description: editForm.description,
        location: editForm.location,
        quantity: Number(editForm.quantity) || 0,
      });
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(item: InventoryItem) {
    const verb = item.archived ? "restore" : "archive";
    if (!window.confirm(`Are you sure you want to ${verb} "${item.name}"?`)) return;
    setError(null);
    try {
      await send(`/api/items/${item.id}`, "PATCH", { archived: !item.archived });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <>
      <BrandHeader title="Products" />

      <div className="wrap">
        <TrailerMotif />

        {error ? <p className="error">{error}</p> : null}

        <Link className="btn btn-print-all" href="/admin/qr-print">
          <span style={{ fontSize: 16 }}>⎙</span> Print all QR codes
        </Link>

        {/* Search + filter */}
        <div className="card">
          <label htmlFor="search" style={{ marginTop: 0 }}>
            Search products
          </label>
          <div className="row" style={{ alignItems: "center" }}>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. plywood, mdf, rack b3…"
            />
            {query ? (
              <button
                className="btn btn-small"
                style={{ flex: "0 0 auto" }}
                onClick={() => setQuery("")}
              >
                Clear
              </button>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <label
              style={{
                margin: 0,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
            <span className="muted">
              {filtered.length} of {items.length} shown
            </span>
          </div>
        </div>

        {/* Add product form */}
        {showAdd ? (
          <div className="card">
            <h1 style={{ fontSize: 18 }}>Add product</h1>
            <label>Product name</label>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. Plywood"
            />
            <label>Description</label>
            <input
              value={addForm.description}
              onChange={(e) =>
                setAddForm({ ...addForm, description: e.target.value })
              }
              placeholder="e.g. Standard plywood sheet"
            />
            <label>Location</label>
            <input
              value={addForm.location}
              onChange={(e) =>
                setAddForm({ ...addForm, location: e.target.value })
              }
              placeholder="e.g. Rack B3 / Yard 2"
            />
            <label>Starting quantity</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={addForm.quantity}
              onChange={(e) =>
                setAddForm({ ...addForm, quantity: e.target.value })
              }
            />
            <div className="row" style={{ marginTop: 16 }}>
              <button
                className="btn btn-dark"
                disabled={saving}
                onClick={addProduct}
              >
                {saving ? "Saving…" : "Save product"}
              </button>
              <button
                className="btn"
                disabled={saving}
                onClick={() => {
                  setShowAdd(false);
                  setAddForm(emptyForm);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {/* Product cards */}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">
            {items.length === 0
              ? "No products yet. Add one below."
              : "No products match your search."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((item) => {
              const editing = editingId === item.id;

              if (editing) {
                return (
                  <div className="card" key={item.id}>
                    <label style={{ marginTop: 0 }}>Product name</label>
                    <input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                    />
                    <label>Description</label>
                    <input
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                    <label>Location</label>
                    <input
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm({ ...editForm, location: e.target.value })
                      }
                    />
                    <label>Quantity</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm({ ...editForm, quantity: e.target.value })
                      }
                    />
                    <div className="row" style={{ marginTop: 16 }}>
                      <button
                        className="btn btn-dark"
                        disabled={saving}
                        onClick={() => saveEdit(item.id)}
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        className="btn"
                        disabled={saving}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  className="card"
                  key={item.id}
                  style={{ opacity: item.archived ? 0.55 : 1 }}
                >
                  {/* title + qty */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div className="card-title">
                        {item.name}
                        {item.archived ? " (archived)" : ""}
                      </div>
                      {item.description ? (
                        <div className="card-desc">{item.description}</div>
                      ) : null}
                    </div>
                    <div className="qty-badge">
                      <div className={`qty-num ${qtyClass(item.quantity)}`}>
                        {item.quantity}
                      </div>
                      <div className="qty-label">Qty</div>
                    </div>
                  </div>

                  {/* location — always shown so it's obvious */}
                  <div className="loc-pill">
                    <span style={{ fontSize: 14 }}>📍</span>
                    <span className={`pill${item.location ? "" : " empty"}`}>
                      {item.location || "No location — tap Edit to add"}
                    </span>
                  </div>

                  {/* media: photo + qr */}
                  <div className="media-row">
                    <div className="media-photo">
                      <div className="photo-box">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image_url} alt="" />
                        ) : (
                          "No photo"
                        )}
                      </div>
                      <PhotoUpload
                        itemId={item.id}
                        hasImage={!!item.image_url}
                        className="btn"
                        onUploaded={load}
                      />
                    </div>
                    <div className="media-qr">
                      <Link
                        href={`/item/${item.slug}`}
                        className="qr-frame"
                        aria-label="Open product page"
                      >
                        <QrCode slug={item.slug} size={92} />
                      </Link>
                      <div className="qr-caption">QR code</div>
                    </div>
                  </div>

                  {/* actions */}
                  <div className="action-grid">
                    <button
                      className="btn btn-dark"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>
                    <Link
                      className="btn"
                      href={`/admin/qr-print?slug=${item.slug}`}
                    >
                      Print QR
                    </Link>
                    <button
                      className="btn btn-muted"
                      onClick={() => toggleArchive(item)}
                    >
                      {item.archived ? "Restore" : "Archive"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="footer-note">Byrne Trailers · Stock Control</div>
      </div>

      {/* sticky add button */}
      <div className="add-bar">
        <button
          className="btn btn-add-primary"
          onClick={() => {
            setShowAdd(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          + Add new product
        </button>
      </div>
    </>
  );
}
