import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { applyStockDelta } from "@/lib/jobsServer";
import { parseMoney } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// POST /api/jobs/[id]/parts — add a part to the job (deducts stock).
// Body: { item_id, quantity? }. If the part is already on the job, its line
// quantity is increased instead of adding a duplicate row.
export async function POST(
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

    const itemId = String(body?.item_id ?? "").trim();
    const addQty = Math.max(1, Math.floor(Number(body?.quantity) || 1));
    if (!itemId) {
      return NextResponse.json({ error: "No part chosen." }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: job } = await supabase
      .from("jobs")
      .select("job_no")
      .eq("id", params.id)
      .maybeSingle();
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const { data: item } = await supabase
      .from("inventory_items")
      .select("id, name, price")
      .eq("id", itemId)
      .maybeSingle();
    if (!item) {
      return NextResponse.json({ error: "Part not found." }, { status: 404 });
    }

    const note = `Job #${job.job_no}`;

    // Merge into an existing line if this part is already on the job.
    const { data: existing } = await supabase
      .from("job_parts")
      .select("*")
      .eq("job_id", params.id)
      .eq("item_id", itemId)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("job_parts")
        .update({ quantity: existing.quantity + addQty })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      await applyStockDelta(supabase, itemId, addQty, note);
      return NextResponse.json({ part: updated });
    }

    const { data: part, error } = await supabase
      .from("job_parts")
      .insert({
        job_id: params.id,
        item_id: itemId,
        name: item.name,
        unit_price: parseMoney((item as any).price),
        quantity: addQty,
      })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await applyStockDelta(supabase, itemId, addQty, note);
    return NextResponse.json({ part });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
