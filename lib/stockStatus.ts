import type { InventoryItem } from "./supabase";

export type StockLevel = "red" | "amber" | "green" | "none";

// Traffic light from a product's min/max reorder levels:
//   red   — at or below min      → order now
//   amber — in the lower half of the min→max band → getting low
//   green — comfortably stocked
//   none  — no levels set yet (not tracked)
export function stockStatus(
  quantity: number,
  min: number | null | undefined,
  max: number | null | undefined
): StockLevel {
  const q = Number(quantity) || 0;
  const mn = Number(min) || 0;
  const mx = Number(max) || 0;

  if (mn <= 0 && mx <= 0) return "none";
  if (q <= mn) return "red";

  const top = mx > mn ? mx : mn * 2;
  const fill = (q - mn) / (top - mn);
  return fill <= 0.5 ? "amber" : "green";
}

export function statusOf(item: InventoryItem): StockLevel {
  return stockStatus(item.quantity, item.min_level, item.max_level);
}

export const STATUS_META: Record<
  StockLevel,
  { label: string; color: string; bg: string; rank: number }
> = {
  red: { label: "Order now", color: "#bb1620", bg: "#fbeaeb", rank: 0 },
  amber: { label: "Low", color: "#9a6a00", bg: "#fbf2dd", rank: 1 },
  green: { label: "OK", color: "#1f7a3d", bg: "#e7f4ec", rank: 2 },
  none: { label: "Not set", color: "#9aa0a9", bg: "#eef0f3", rank: 3 },
};
