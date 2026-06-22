-- Timber Stock — add a price field (and make sure location/image_url exist).
-- Run this once in the Supabase SQL editor (safe to re-run).
alter table public.inventory_items
  add column if not exists location  text,
  add column if not exists image_url text,
  add column if not exists price     text;
