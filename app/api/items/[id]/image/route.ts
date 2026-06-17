import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { pinIsValid } from "@/lib/pin";
import { randomSuffix } from "@/lib/slug";

export const dynamic = "force-dynamic";

const BUCKET = "product-images";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB — plenty for a phone photo

// POST /api/items/[id]/image — upload/replace a product photo. Requires PIN.
// Accepts multipart form-data: { pin, file }.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (!pinIsValid(form.get("pin"))) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No photo selected." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo is too big (max 15MB)." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "That file isn't an image." }, { status: 400 });
  }

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${params.id}/${randomSuffix()}.${ext}`;

  const supabase = getServiceClient();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const image_url = pub.publicUrl;

  const { data, error } = await supabase
    .from("inventory_items")
    .update({ image_url })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}
