import { notFound } from "next/navigation";
import { getServiceClient, InventoryItem } from "@/lib/supabase";
import BrandHeader from "@/app/components/BrandHeader";
import ItemActions from "./ItemActions";
import ScanPhoto from "./ScanPhoto";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  const item = data as InventoryItem | null;
  if (!item || item.archived) {
    notFound();
  }

  return (
    <>
      <BrandHeader title="Stock" />
      <div className="wrap">
        <div className="card">
          <div className="card-title" style={{ fontSize: 22 }}>
            {item.name}
          </div>
          {item.description ? (
            <div className="card-desc">{item.description}</div>
          ) : null}
          <div className="loc-block">
            <span className="loc-icon">📍</span>
            <div>
              <div className="loc-label">Location</div>
              <div className={`loc-value${item.location ? "" : " empty"}`}>
                {item.location || "Not set"}
              </div>
            </div>
          </div>
        </div>

        <ScanPhoto itemId={item.id} imageUrl={item.image_url} />

        <ItemActions slug={item.slug} initialQuantity={item.quantity} />
      </div>
    </>
  );
}
