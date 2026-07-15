import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { jobTotals } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// GET /api/jobs — list jobs (newest first) with a computed grand total.
export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .order("job_no", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: parts } = await supabase
      .from("job_parts")
      .select("job_id, unit_price, quantity");

    const withTotals = (jobs ?? []).map((job) => {
      const jobParts = (parts ?? []).filter((p) => p.job_id === job.id);
      const { grandTotal } = jobTotals(
        jobParts as any,
        job.hours,
        job.hourly_rate
      );
      return { ...job, total: grandTotal };
    });

    return NextResponse.json({ jobs: withTotals });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}

// POST /api/jobs — create a blank job.
export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      /* empty body is fine for a blank job */
    }
    const title = String(body?.title ?? "").trim() || null;

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert({ title })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ job: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
