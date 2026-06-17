import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { pinIsValid } from "@/lib/pin";

export const dynamic = "force-dynamic";

// POST /api/move — change a product's quantity by +1 or -1 from the scan page.
// Body: { pin, slug, change }. Requires PIN. Never lets quantity go below 0.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!pinIsValid(body?.pin)) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  const slug = String(body?.slug ?? "").trim();
  const change = Math.trunc(Number(body?.change));
  if (!slug || (change !== 1 && change !== -1)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Read-modify-write with optimistic concurrency so two phones tapping at
  // once can't clobber each other. Retry a few times on a lost race.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: item, error: readErr } = await supabase
      .from("inventory_items")
      .select("id, quantity, archived")
      .eq("slug", slug)
      .single();

    if (readErr || !item) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    if (item.archived) {
      return NextResponse.json({ error: "This product is archived." }, { status: 400 });
    }

    const newQuantity = item.quantity + change;
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "Quantity can't go below 0.", quantity: item.quantity },
        { status: 400 }
      );
    }

    // Only succeeds if quantity is still what we just read.
    const { data: updated, error: updateErr } = await supabase
      .from("inventory_items")
      .update({ quantity: newQuantity })
      .eq("id", item.id)
      .eq("quantity", item.quantity)
      .select("id, quantity")
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    if (!updated) {
      // Someone else changed it first — retry.
      continue;
    }

    await supabase.from("stock_movements").insert({
      item_id: item.id,
      change_amount: change,
      quantity_after: newQuantity,
      note: change > 0 ? "Add 1 (scan)" : "Take away 1 (scan)",
    });

    return NextResponse.json({ quantity: newQuantity });
  }

  return NextResponse.json(
    { error: "Busy, please try again." },
    { status: 409 }
  );
}
