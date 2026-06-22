import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// PATCH /api/items/[id] — edit a product or archive/unarchive it.
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

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { error: "Product name is required." },
          { status: 400 }
        );
      }
      update.name = name;
    }
    if (body.description !== undefined) {
      update.description = String(body.description).trim() || null;
    }
    if (body.size !== undefined) {
      update.size = String(body.size).trim() || null;
    }
    if (body.location !== undefined) {
      update.location = String(body.location).trim() || null;
    }
    if (body.price !== undefined) {
      update.price = String(body.price).trim() || null;
    }
    if (body.quantity !== undefined) {
      update.quantity = Math.max(0, Math.floor(Number(body.quantity) || 0));
    }
    if (body.archived !== undefined) {
      update.archived = Boolean(body.archived);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .update(update)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ item: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
