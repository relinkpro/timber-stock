"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandHeader from "@/app/components/BrandHeader";
import { formatMoney, jobTotals, type Job, type JobPart } from "@/lib/jobs";
import type { InventoryItem } from "@/lib/supabase";

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function JobEditorPage({ params }: { params: { id: string } }) {
  const jobId = params.id;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [parts, setParts] = useState<JobPart[]>([]);
  const [catalog, setCatalog] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // local, editable fields (saved on blur)
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("0");
  const [rate, setRate] = useState("0");

  const [query, setQuery] = useState("");

  const loadJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}`);
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.error || "Failed to load job");
    setJob(data.job);
    setParts(data.parts);
    setTitle(data.job.title ?? "");
    setHours(String(data.job.hours ?? 0));
    setRate(String(data.job.hourly_rate ?? 0));
  }, [jobId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await loadJob();
        const res = await fetch("/api/items");
        const data = await safeJson(res);
        if (res.ok) setCatalog(data.items as InventoryItem[]);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadJob]);

  async function saveJob(patch: object) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Save failed");
      setJob(data.job);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function addPart(item: InventoryItem) {
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id, quantity: 1 }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Could not add part");
      setQuery("");
      await loadJob();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function setLineQty(line: JobPart, quantity: number) {
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/parts/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Update failed");
      await loadJob();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteJob() {
    if (!window.confirm("Delete this job? Parts used will be returned to stock."))
      return;
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.error || "Delete failed");
      }
      router.push("/jobs");
    } catch (e: any) {
      setError(e.message);
    }
  }

  const { partsTotal, labourTotal, grandTotal } = jobTotals(
    parts,
    Number(hours) || 0,
    Number(rate) || 0
  );

  // Same keyword search as the stock list.
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results =
    terms.length === 0
      ? []
      : catalog
          .filter((it) => !it.archived)
          .filter((it) => {
            const hay = [it.name, it.description, it.location, it.size]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return terms.every((t) => hay.includes(t));
          })
          .slice(0, 12);

  if (loading) {
    return (
      <>
        <BrandHeader title="Job" />
        <div className="wrap">
          <p className="muted">Loading…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <BrandHeader title={job ? `Job #${job.job_no}` : "Job"} />
      <div className="wrap">
        <p className="muted">
          <Link href="/jobs">← All jobs</Link>
        </p>

        {error ? <p className="error">{error}</p> : null}

        {/* Job title */}
        <div className="card">
          <label style={{ marginTop: 0 }}>Job / customer / reg</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => saveJob({ title })}
            placeholder="e.g. 12-D-3456 — brake service"
          />
        </div>

        {/* Add parts */}
        <div className="card">
          <label style={{ marginTop: 0 }}>Add a part</label>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts by name or location…"
          />
          {results.length > 0 ? (
            <div className="search-results">
              {results.map((it) => (
                <button
                  key={it.id}
                  className="search-result"
                  onClick={() => addPart(it)}
                >
                  <span>
                    <strong>{it.name}</strong>
                    {it.location ? (
                      <span className="muted"> · {it.location}</span>
                    ) : null}
                    <span className="muted"> · {it.quantity} in stock</span>
                  </span>
                  <span className="muted">
                    {it.price ? it.price : "—"} · Add +
                  </span>
                </button>
              ))}
            </div>
          ) : query ? (
            <p className="muted" style={{ marginBottom: 0 }}>
              No matching parts.
            </p>
          ) : null}
        </div>

        {/* Parts on the job */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16, marginBottom: 8 }}>
            Parts
          </div>
          {parts.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No parts added yet.
            </p>
          ) : (
            <div className="job-lines">
              {parts.map((p) => (
                <div className="job-line" key={p.id}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {formatMoney(p.unit_price)} each
                    </div>
                  </div>
                  <div className="qty-stepper">
                    <button onClick={() => setLineQty(p, p.quantity - 1)}>
                      −
                    </button>
                    <span>{p.quantity}</span>
                    <button onClick={() => setLineQty(p, p.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <div className="line-total">
                    {formatMoney(Number(p.unit_price) * Number(p.quantity))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labour */}
        <div className="card">
          <div className="card-title" style={{ fontSize: 16 }}>
            Labour
          </div>
          <div className="row">
            <div>
              <label>Hours</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                onBlur={() => saveJob({ hours: Number(hours) || 0 })}
              />
            </div>
            <div>
              <label>Hourly rate</label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                onBlur={() => saveJob({ hourly_rate: Number(rate) || 0 })}
              />
            </div>
          </div>
          <div className="totals-line" style={{ marginTop: 12 }}>
            <span>Labour</span>
            <span>{formatMoney(labourTotal)}</span>
          </div>
        </div>

        {/* Totals */}
        <div className="card">
          <div className="totals-line">
            <span>Parts</span>
            <span>{formatMoney(partsTotal)}</span>
          </div>
          <div className="totals-line">
            <span>Labour</span>
            <span>{formatMoney(labourTotal)}</span>
          </div>
          <div className="totals-line grand">
            <span>Total</span>
            <span>{formatMoney(grandTotal)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Link className="btn btn-dark" href={`/jobs/${jobId}/print`}>
            🖨 Print job sheet
          </Link>
        </div>
        <button className="btn btn-muted" onClick={deleteJob}>
          Delete job
        </button>

        <div className="footer-note">Byrne Trailers · Stock Control</div>
      </div>
    </>
  );
}
