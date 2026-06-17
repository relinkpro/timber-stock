import Link from "next/link";

// Sticky dark brand header from the Byrne Trailers stock-control design.
export default function BrandHeader({ title = "Products" }: { title?: string }) {
  return (
    <div className="brand-header">
      <Link href="/admin/items" aria-label="Home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/byrne-logo.png" alt="Byrne Trailers" />
      </Link>
      <div style={{ lineHeight: 1.1 }}>
        <div className="brand-eyebrow">Stock Control</div>
        <div className="brand-title">{title}</div>
      </div>
    </div>
  );
}
