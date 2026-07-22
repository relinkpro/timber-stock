-- Timber Stock — per-product min/max reorder levels (for traffic lights + dashboard).
-- Run this once in the Supabase SQL editor (safe to re-run).
alter table public.inventory_items
  add column if not exists min_level integer not null default 0,
  add column if not exists max_level integer not null default 0;
