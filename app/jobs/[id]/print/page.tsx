import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase";
import { formatMoney, jobTotals, type Job, type JobPart } from "@/lib/jobs";
import PrintButton from "@/app/admin/qr-print/PrintButton";

export const dynamic = "force-dynamic";

export default async function JobPrintPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getServiceClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!job) notFound();
  const j = job as Job;

  const { data: partsData } = await supabase
    .from("job_parts")
    .select("*")
    .eq("job_id", params.id)
    .order("created_at", { ascending: true });
  const parts = (partsData ?? []) as JobPart[];

  const { partsTotal, labourTotal, grandTotal } = jobTotals(
    parts,
    j.hours,
    j.hourly_rate
  );

  return (
    <div className="wrap">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <h1>Job #{j.job_no}</h1>
        <p className="muted">
          Always up to date — press Print for a fresh sheet.{" "}
          <Link href={`/jobs/${j.id}`}>Back to job</Link>
        </p>
        <PrintButton label="Print job sheet" />
      </div>

      {/* sheet header */}
      <div className="sheet-head">
        <div>
          <div className="sheet-title">Job #{j.job_no}</div>
          {j.title ? <div className="sheet-sub">{j.title}</div> : null}
        </div>
        <div className="sheet-sub">
          {new Date(j.created_at).toLocaleDateString("en-IE")}
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th>Part</th>
            <th className="col-price">Unit price</th>
            <th className="col-qty">Qty</th>
            <th className="col-price">Line total</th>
          </tr>
        </thead>
        <tbody>
          {parts.length === 0 ? (
            <tr>
              <td colSpan={4} className="muted">
                No parts on this job.
              </td>
            </tr>
          ) : (
            parts.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="sheet-name">{p.name}</span>
                </td>
                <td className="col-price">{formatMoney(p.unit_price)}</td>
                <td className="col-qty">{p.quantity}</td>
                <td className="col-price sheet-price">
                  {formatMoney(Number(p.unit_price) * Number(p.quantity))}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="foot-label">
              Parts total
            </td>
            <td className="col-price sheet-price">{formatMoney(partsTotal)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="foot-label">
              Labour — {Number(j.hours) || 0} hrs @ {formatMoney(j.hourly_rate)}
            </td>
            <td className="col-price sheet-price">{formatMoney(labourTotal)}</td>
          </tr>
          <tr>
            <td colSpan={3} className="foot-label grand">
              Total
            </td>
            <td className="col-price sheet-price grand">
              {formatMoney(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="footer-note">Byrne Trailers · Stock Control</div>
    </div>
  );
}
