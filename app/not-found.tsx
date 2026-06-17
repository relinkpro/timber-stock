import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <div className="card">
        <h1>Not found</h1>
        <p className="muted">
          This product doesn&apos;t exist or has been archived.
        </p>
        <Link className="btn" href="/admin/items">
          Go to products
        </Link>
      </div>
    </div>
  );
}
