import type { InventoryItem } from "./supabase";

// Natural alphanumeric ordering so "A2" sorts before "A10" and letters group
// correctly: a1, a2, a10, b2, b3 … Sorts by product name, then location.
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function byNaturalOrder(a: InventoryItem, b: InventoryItem): number {
  return (
    collator.compare(a.name || "", b.name || "") ||
    collator.compare(a.location || "", b.location || "") ||
    collator.compare(a.size || "", b.size || "")
  );
}

// Return a new array sorted in natural order (does not mutate the input).
export function sortNatural(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort(byNaturalOrder);
}
