"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button className="btn btn-dark" onClick={() => window.print()}>
      {label}
    </button>
  );
}
