// Shared, client-safe types + money helpers for the Jobs section.

export type Job = {
  id: string;
  job_no: number;
  title: string | null;
  hours: number;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
};

export type JobPart = {
  id: string;
  job_id: string;
  item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  created_at: string;
};

export const CURRENCY = "€";

// Pull a number out of a free-text price like "€24.50" or "24,50" -> 24.5.
export function parseMoney(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v ?? "").replace(/,/g, "");
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

export function formatMoney(n: unknown): string {
  const num = Number(n) || 0;
  return (
    CURRENCY +
    num.toLocaleString("en-IE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Totals for a job given its parts + labour.
export function jobTotals(
  parts: { unit_price: number; quantity: number }[],
  hours: number,
  hourlyRate: number
) {
  const partsTotal = parts.reduce(
    (sum, p) => sum + Number(p.unit_price) * Number(p.quantity),
    0
  );
  const labourTotal = Number(hours) * Number(hourlyRate);
  return { partsTotal, labourTotal, grandTotal: partsTotal + labourTotal };
}
