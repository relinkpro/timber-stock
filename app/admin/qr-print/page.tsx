import Link from "next/link";
import { getServiceClient, InventoryItem } from "@/lib/supabase";
import { sortNatural } from "@/lib/naturalSort";
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
    .eq("archived", false);

  if (searchParams.slug) {
    query = query.eq("slug", searchParams.slug);
  }

  const { data } = await query;
  // Same natural alphanumeric order as the stock list (a1, a2, b2 …).
  const items = sortNatural((data ?? []) as InventoryItem[]);

  const single = Boolean(searchParams.slug);

  return (
    <div className="wrap">
      <div className="no-print" style={{ marginBottom: 16 }}>
        <h1>{single ? "Print QR label" : "Stock sheet"}</h1>
        <p className="muted">
          Always up to date — press Print for a fresh sheet.{" "}
          <Link href="/admin/items">Back to products</Link>
        </p>
        <PrintButton label={single ? "Print label" : "Print stock sheet"} />
      </div>

      {items.length === 0 ? (
        <p className="no-print">No products to print.</p>
      ) : (
        <table className="print-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-photo">Photo</th>
              <th>Product</th>
              <th className="col-price">Price</th>
              <th className="col-qty">Qty</th>
              <th className="col-qr">Scan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id}>
                <td className="col-num">{i + 1}</td>
                <td className="col-photo">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="sheet-photo" src={item.image_url} alt="" />
                  ) : (
                    <div className="sheet-photo placeholder" />
                  )}
                </td>
                <td>
                  <div className="sheet-name">{item.name}</div>
                  {item.location ? (
                    <div className="sheet-sub">📍 {item.location}</div>
                  ) : null}
                  {item.description ? (
                    <div className="sheet-sub">{item.description}</div>
                  ) : null}
                </td>
                <td className="col-price sheet-price">{item.price || "—"}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-qr">
                  <div className="sheet-qr">
                    <QrCode slug={item.slug} size={84} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
