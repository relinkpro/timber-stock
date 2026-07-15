import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { applyStockDelta } from "@/lib/jobsServer";

export const dynamic = "force-dynamic";

async function jobNote(supabase: any, jobId: string): Promise<string> {
  const { data } = await supabase
    .from("jobs")
    .select("job_no")
    .eq("id", jobId)
    .maybeSingle();
  return `Job #${data?.job_no ?? ""}`;
}

// PATCH /api/jobs/[id]/parts/[lineId] — set a line's quantity (adjusts stock
// by the delta). A quantity of 0 or less removes the line and restores stock.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const newQty = Math.floor(Number(body?.quantity));
    if (!Number.isFinite(newQty)) {
      return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: line } = await supabase
      .from("job_parts")
      .select("*")
      .eq("id", params.lineId)
      .eq("job_id", params.id)
      .maybeSingle();
    if (!line) {
      return NextResponse.json({ error: "Line not found." }, { status: 404 });
    }

    const note = await jobNote(supabase, params.id);
    const delta = newQty - line.quantity; // + uses more stock, - restores

    if (newQty <= 0) {
      await applyStockDelta(supabase, line.item_id, -line.quantity, note);
      await supabase.from("job_parts").delete().eq("id", params.lineId);
      return NextResponse.json({ removed: true });
    }

    const { data: updated, error } = await supabase
      .from("job_parts")
      .update({ quantity: newQty })
      .eq("id", params.lineId)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    await applyStockDelta(supabase, line.item_id, delta, note);
    return NextResponse.json({ part: updated });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id]/parts/[lineId] — remove a line and restore its stock.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const supabase = getServiceClient();
    const { data: line } = await supabase
      .from("job_parts")
      .select("*")
      .eq("id", params.lineId)
      .eq("job_id", params.id)
      .maybeSingle();
    if (!line) {
      return NextResponse.json({ error: "Line not found." }, { status: 404 });
    }

    const note = await jobNote(supabase, params.id);
    await applyStockDelta(supabase, line.item_id, -line.quantity, note);
    await supabase.from("job_parts").delete().eq("id", params.lineId);
    return NextResponse.json({ removed: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
