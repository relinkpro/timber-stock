-- Timber Stock — Supabase schema, security, and seed data.
-- Run this once in the Supabase SQL editor (or via the CLI).

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.inventory_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  size        text,
  quantity    integer not null default 0,
  slug        text unique not null,
  location    text,
  image_url   text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id             uuid primary key default gen_random_uuid(),
  item_id        uuid not null references public.inventory_items(id) on delete cascade,
  change_amount  integer not null,
  quantity_after integer not null,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists stock_movements_item_id_idx
  on public.stock_movements (item_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh on every change to inventory_items
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Security: lock the tables down.
-- The app only ever talks to these tables from the server using the
-- service-role key (which bypasses RLS). With RLS enabled and no policies,
-- the public/anon keys cannot read or write anything directly.
-- ---------------------------------------------------------------------------

alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;

-- Public storage bucket for product photos. Public read so photos show on the
-- scan page; uploads happen server-side with the service-role key.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- ---------------------------------------------------------------------------
-- Seed data — ~10 starter timber products
-- ---------------------------------------------------------------------------

insert into public.inventory_items (name, description, size, quantity, slug)
values
  ('OSB',        'Oriented strand board sheet',        '2440 x 1220 x 18mm', 40, 'osb-2440x1220x18'),
  ('OSB',        'Oriented strand board sheet',        '2440 x 1220 x 11mm', 35, 'osb-2440x1220x11'),
  ('Plywood',    'Standard plywood sheet',             '2440 x 1220 x 18mm', 50, 'plywood-2440x1220x18'),
  ('Plywood',    'Standard plywood sheet',             '2440 x 1220 x 12mm', 45, 'plywood-2440x1220x12'),
  ('Plywood',    'Standard plywood sheet',             '2440 x 1220 x 9mm',  30, 'plywood-2440x1220x9'),
  ('MDF',        'Medium-density fibreboard sheet',    '2440 x 1220 x 18mm', 60, 'mdf-2440x1220x18'),
  ('MDF',        'Medium-density fibreboard sheet',    '2440 x 1220 x 12mm', 55, 'mdf-2440x1220x12'),
  ('MDF',        'Medium-density fibreboard sheet',    '2440 x 1220 x 6mm',  25, 'mdf-2440x1220x6'),
  ('Birch Ply',  'Birch faced plywood sheet',          '2500 x 1250 x 18mm', 20, 'birch-ply-2500x1250x18'),
  ('MDF',        'Medium-density fibreboard sheet',    '3050 x 1220 x 18mm', 15, 'mdf-3050x1220x18')
on conflict (slug) do nothing;
