import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { applyStockDelta } from "@/lib/jobsServer";

export const dynamic = "force-dynamic";

// GET /api/jobs/[id] — a job with its part lines.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const { data: parts } = await supabase
      .from("job_parts")
      .select("*")
      .eq("job_id", params.id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ job, parts: parts ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] — edit title / hours / hourly rate.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = String(body.title).trim() || null;
    if (body.hours !== undefined) update.hours = Math.max(0, Number(body.hours) || 0);
    if (body.hourly_rate !== undefined)
      update.hourly_rate = Math.max(0, Number(body.hourly_rate) || 0);

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("jobs")
      .update(update)
      .eq("id", params.id)
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

// DELETE /api/jobs/[id] — delete a job and restore the stock its parts used.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceClient();

    const { data: job } = await supabase
      .from("jobs")
      .select("job_no")
      .eq("id", params.id)
      .maybeSingle();

    const { data: parts } = await supabase
      .from("job_parts")
      .select("item_id, quantity")
      .eq("job_id", params.id);

    for (const p of parts ?? []) {
      // negative deduct = restore
      await applyStockDelta(
        supabase,
        p.item_id,
        -Number(p.quantity),
        `Job #${job?.job_no ?? ""} deleted`
      );
    }

    const { error } = await supabase.from("jobs").delete().eq("id", params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
