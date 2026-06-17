import Link from "next/link";
import BrandHeader from "@/app/components/BrandHeader";

export default function HomePage() {
  return (
    <>
      <BrandHeader title="Stock Control" />
      <div className="wrap">
        <p className="muted">
          Scan a product QR code with your phone to add or take away stock.
        </p>

        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <Link className="btn btn-dark" href="/admin/items">
              Manage products
            </Link>
          </div>
          <Link className="btn" href="/admin/qr-print">
            Print all QR codes
          </Link>
        </div>
      </div>
    </>
  );
}
