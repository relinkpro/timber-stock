"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandHeader from "@/app/components/BrandHeader";
import { formatMoney } from "@/lib/jobs";

type JobRow = {
  id: string;
  job_no: number;
  title: string | null;
  created_at: string;
  total: number;
};

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Failed to load jobs");
      setJobs(data.jobs as JobRow[]);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function newJob() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || "Could not create job");
      router.push(`/jobs/${data.job.id}`);
    } catch (e: any) {
      setError(e.message);
      setCreating(false);
    }
  }

  return (
    <>
      <BrandHeader title="Jobs" />
      <div className="wrap">
        <p className="muted">
          <Link href="/admin/items">← Products &amp; stock</Link>
        </p>

        {error ? <p className="error">{error}</p> : null}

        <div style={{ marginBottom: 16 }}>
          <button
            className="btn btn-add-primary"
            disabled={creating}
            onClick={newJob}
          >
            {creating ? "Creating…" : "+ New job"}
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="muted">No jobs yet. Tap “New job” to start one.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="card"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <div className="card-title" style={{ fontSize: 16 }}>
                      Job #{job.job_no}
                    </div>
                    <div className="card-desc">
                      {job.title || "Untitled job"}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {new Date(job.created_at).toLocaleDateString("en-IE")}
                    </div>
                  </div>
                  <div className="card-price" style={{ marginTop: 0 }}>
                    {formatMoney(job.total)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="footer-note">Byrne Trailers · Stock Control</div>
      </div>
    </>
  );
}
