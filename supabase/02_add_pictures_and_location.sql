-- Timber Stock — add product pictures + location.
-- Run this once in the Supabase SQL editor (safe to re-run).

-- New columns on inventory_items
alter table public.inventory_items
  add column if not exists image_url text,
  add column if not exists location  text;

-- Public storage bucket for product photos.
-- Public read so the photo shows on the scan page without signed URLs.
-- Uploads happen server-side with the service-role key, so no extra
-- storage RLS policies are required.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
