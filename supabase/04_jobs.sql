-- Timber Stock — Jobs section (job cards / priced sheets for mechanics).
-- Run this once in the Supabase SQL editor (safe to re-run).

create extension if not exists "pgcrypto";

-- Reused by the updated_at trigger below (already exists from the base
-- migration, re-declared here so this file is self-contained).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.jobs (
  id          uuid primary key default gen_random_uuid(),
  job_no      bigint generated always as identity,
  title       text,
  hours       numeric not null default 0,
  hourly_rate numeric not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.job_parts (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references public.jobs(id) on delete cascade,
  item_id    uuid references public.inventory_items(id) on delete set null,
  name       text not null,
  unit_price numeric not null default 0,
  quantity   integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists job_parts_job_id_idx on public.job_parts (job_id);

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- Locked down like the rest — only the server (service-role key) touches them.
alter table public.jobs enable row level security;
alter table public.job_parts enable row level security;
