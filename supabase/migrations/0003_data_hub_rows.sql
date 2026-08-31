-- ============================================================
-- NEXORA V1
-- Migration 0003: Data Hub row storage
-- ============================================================

create table public.dataset_rows (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  dataset_id uuid not null
    references public.datasets(id)
    on delete cascade,

  row_number integer not null,

  row_data jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  unique (dataset_id, row_number)
);

create index dataset_rows_business_id_idx
  on public.dataset_rows(business_id);

create index dataset_rows_dataset_id_idx
  on public.dataset_rows(dataset_id);

alter table public.dataset_rows enable row level security;

create policy "members can access dataset rows"
on public.dataset_rows
for all
to authenticated
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);