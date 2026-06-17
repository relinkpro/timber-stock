// Faint trailer line-art motif used as a subtle page background accent.
export default function TrailerMotif() {
  return (
    <svg
      className="trailer-motif"
      viewBox="0 0 320 120"
      fill="none"
      stroke="#14161a"
      strokeWidth={3}
      aria-hidden
    >
      <rect x="40" y="20" width="210" height="48" rx="4" />
      <path d="M250 40 h34 l16 18 v10 h-50z" />
      <line x1="40" y1="68" x2="300" y2="68" />
      <circle cx="110" cy="86" r="16" />
      <circle cx="190" cy="86" r="16" />
    </svg>
  );
}
