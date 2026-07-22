import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { slugify, randomSuffix } from "@/lib/slug";

export const dynamic = "force-dynamic";

// GET /api/items — list every product (admin table needs archived ones too).
export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .order("name", { ascending: true })
      .order("size", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ items: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}

// POST /api/items — create a product.
export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Product name is required." },
        { status: 400 }
      );
    }

    const description = String(body?.description ?? "").trim() || null;
    const size = String(body?.size ?? "").trim() || null;
    const location = String(body?.location ?? "").trim() || null;
    const price = String(body?.price ?? "").trim() || null;
    const quantity = Math.max(0, Math.floor(Number(body?.quantity) || 0));
    const min_level = Math.max(0, Math.floor(Number(body?.min_level) || 0));
    const max_level = Math.max(0, Math.floor(Number(body?.max_level) || 0));

    const supabase = getServiceClient();

    // Generate a unique slug, retrying with a suffix on collision.
    let slug = slugify(name, size);
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          name,
          description,
          size,
          location,
          price,
          quantity,
          min_level,
          max_level,
          slug,
        })
        .select("*")
        .single();

      if (!error) {
        return NextResponse.json({ item: data });
      }
      if (error.code === "23505") {
        // Unique violation on slug — try again with a random suffix.
        slug = `${slugify(name, size)}-${randomSuffix()}`;
        continue;
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Could not generate a unique slug." },
      { status: 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error." },
      { status: 500 }
    );
  }
}
