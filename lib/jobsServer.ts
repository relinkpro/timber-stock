import type { SupabaseClient } from "@supabase/supabase-js";

// Apply a stock change driven by a job: deduct `deductUnits` from an item's
// quantity (negative restores it) and log a stock_movement. Exact and
// reversible — quantity is the single source of truth, so it may go negative
// if a job uses more than is on hand (which flags a shortage).
export async function applyStockDelta(
  supabase: SupabaseClient,
  itemId: string | null,
  deductUnits: number,
  note: string
): Promise<void> {
  if (!itemId || !deductUnits) return;

  const { data: item } = await supabase
    .from("inventory_items")
    .select("quantity")
    .eq("id", itemId)
    .maybeSingle();

  if (!item) return; // item was deleted — nothing to adjust

  const newQuantity = Number(item.quantity) - deductUnits;

  await supabase
    .from("inventory_items")
    .update({ quantity: newQuantity })
    .eq("id", itemId);

  await supabase.from("stock_movements").insert({
    item_id: itemId,
    change_amount: -deductUnits,
    quantity_after: newQuantity,
    note,
  });
}
