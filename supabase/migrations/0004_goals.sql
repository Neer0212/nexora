create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  goal_key text not null,
  target numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, goal_key)
);

alter table public.goals enable row level security;

create policy "members can access goals"
on public.goals
for all
to authenticated
using (
  exists (
    select 1 from public.business_users bu
    where bu.business_id = goals.business_id
      and bu.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.business_users bu
    where bu.business_id = goals.business_id
      and bu.user_id = auth.uid()
  )
);

create index if not exists goals_business_id_idx on public.goals(business_id);
