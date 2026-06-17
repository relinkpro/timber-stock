import Link from "next/link";
import { getServiceClient, InventoryItem } from "@/lib/supabase";
import QrCode from "@/app/components/QrCode";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function QrPrintPage({
  searchParams,
}: {
  searchParams: { slug?: string };
}) {
  const supabase = getServiceClient();
  let query = supabase
    .from("inventory_items")
    .select("*")
    .eq("archived", false)
    .order("name", { ascending: true })
    .order("size", { ascending: true });

  if (searchParams.slug) {
    query = query.eq("slug", searchParams.slug);
  }

  const { data } = await query;
  const items = (data ?? []) as InventoryItem[];

  const single = Boolean(searchParams.slug);

  return (
    <div className="wrap">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <h1>{single ? "Print QR label" : "Print all QR codes"}</h1>
        <p className="muted">
          Press print, then cut along the dashed lines.{" "}
          <Link href="/admin/items">Back to products</Link>
        </p>
        <PrintButton label={single ? "Print label" : "Print all labels"} />
      </div>

      {items.length === 0 ? (
        <p className="no-print">No products to print.</p>
      ) : (
        <div className="print-grid">
          {items.map((item) => (
            <div className="label" key={item.id}>
              <div className="label-name">{item.name}</div>
              <div style={{ margin: "8px 0" }}>
                <QrCode slug={item.slug} size={150} />
              </div>
              {item.description ? (
                <div className="label-desc">{item.description}</div>
              ) : null}
              {item.location ? (
                <div className="label-desc">Location: {item.location}</div>
              ) : null}
              <div className="label-qty">Current quantity: {item.quantity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
