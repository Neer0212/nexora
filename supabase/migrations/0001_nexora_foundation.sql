-- ============================================================
-- NEXORA V1
-- Migration 0001: Foundation
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------

create extension if not exists "pgcrypto";


-- ============================================================
-- ENUMS
-- ============================================================

create type public.business_member_role as enum (
  'owner',
  'admin',
  'member'
);

create type public.dataset_status as enum (
  'uploaded',
  'processing',
  'ready',
  'failed'
);

create type public.import_status as enum (
  'pending',
  'processing',
  'completed',
  'partial',
  'failed'
);

create type public.entity_type as enum (
  'customer',
  'company',
  'supplier',
  'dealer',
  'distributor',
  'contractor',
  'employee',
  'site',
  'project'
);

create type public.order_status as enum (
  'draft',
  'confirmed',
  'processing',
  'completed',
  'cancelled'
);

create type public.invoice_status as enum (
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled'
);

create type public.inventory_transaction_type as enum (
  'purchase',
  'sale',
  'adjustment',
  'return',
  'transfer'
);

create type public.recommendation_status as enum (
  'new',
  'reviewed',
  'accepted',
  'dismissed',
  'completed'
);


-- ============================================================
-- BUSINESSES / TENANCY
-- ============================================================

create table public.businesses (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,

  business_type text,

  industry text,

  description text,

  currency_code text not null default 'INR',

  country_code text not null default 'IN',

  timezone text not null default 'Asia/Kolkata',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table public.business_users (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  role public.business_member_role not null default 'member',

  created_at timestamptz not null default now(),

  unique (business_id, user_id)
);


create index business_users_user_id_idx
  on public.business_users(user_id);

create index business_users_business_id_idx
  on public.business_users(business_id);


-- ============================================================
-- DATA HUB
-- ============================================================

create table public.datasets (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  name text not null,

  description text,

  source_type text not null default 'upload',

  file_name text,

  storage_path text,

  file_size bigint,

  row_count integer,

  column_count integer,

  status public.dataset_status not null default 'uploaded',

  schema_definition jsonb not null default '{}'::jsonb,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table public.data_imports (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  dataset_id uuid
    references public.datasets(id)
    on delete set null,

  file_name text not null,

  status public.import_status not null default 'pending',

  rows_detected integer not null default 0,

  rows_imported integer not null default 0,

  rows_rejected integer not null default 0,

  mapping jsonb not null default '{}'::jsonb,

  errors jsonb not null default '[]'::jsonb,

  started_at timestamptz,

  completed_at timestamptz,

  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);


create index datasets_business_id_idx
  on public.datasets(business_id);

create index data_imports_business_id_idx
  on public.data_imports(business_id);


-- ============================================================
-- GENERIC BUSINESS ENTITIES
-- ============================================================

create table public.entities (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  type public.entity_type not null,

  name text not null,

  code text,

  email text,

  phone text,

  location text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index entities_business_id_idx
  on public.entities(business_id);

create index entities_business_type_idx
  on public.entities(business_id, type);

create index entities_name_idx
  on public.entities(business_id, name);


-- ============================================================
-- PRODUCTS
-- ============================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  name text not null,

  sku text,

  category text,

  unit text,

  unit_cost numeric(14,2),

  selling_price numeric(14,2),

  active boolean not null default true,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index products_business_id_idx
  on public.products(business_id);

create index products_sku_idx
  on public.products(business_id, sku);


-- ============================================================
-- SUPPLIERS
-- ============================================================

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  name text not null,

  code text,

  location text,

  reliability numeric(5,2),

  average_lead_time numeric(8,2),

  price_change_percent numeric(8,2),

  status text not null default 'Active',

  contact_name text,

  email text,

  phone text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index suppliers_business_id_idx
  on public.suppliers(business_id);


-- ============================================================
-- CUSTOMERS / COMPANIES
-- ============================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  name text not null,

  code text,

  type text,

  location text,

  email text,

  phone text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index customers_business_id_idx
  on public.customers(business_id);


-- ============================================================
-- PROJECTS
-- ============================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  name text not null,

  code text,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  status text,

  start_date date,

  expected_end_date date,

  actual_end_date date,

  contract_value numeric(14,2),

  estimated_cost numeric(14,2),

  actual_cost numeric(14,2),

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create index projects_business_id_idx
  on public.projects(business_id);

create index projects_customer_id_idx
  on public.projects(customer_id);


-- ============================================================
-- ORDERS
-- ============================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  order_number text not null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  project_id uuid
    references public.projects(id)
    on delete set null,

  status public.order_status not null default 'draft',

  order_date date not null,

  delivery_date date,

  subtotal numeric(14,2) not null default 0,

  tax_amount numeric(14,2) not null default 0,

  total_amount numeric(14,2) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, order_number)
);


create table public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  product_id uuid
    references public.products(id)
    on delete set null,

  description text,

  quantity numeric(14,3) not null default 0,

  unit_price numeric(14,2) not null default 0,

  total_amount numeric(14,2) not null default 0,

  created_at timestamptz not null default now()
);


create index orders_business_id_idx
  on public.orders(business_id);

create index orders_customer_id_idx
  on public.orders(customer_id);

create index orders_project_id_idx
  on public.orders(project_id);

create index order_items_order_id_idx
  on public.order_items(order_id);


-- ============================================================
-- INVOICES
-- ============================================================

create table public.invoices (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  invoice_number text not null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  project_id uuid
    references public.projects(id)
    on delete set null,

  invoice_date date not null,

  due_date date,

  status public.invoice_status not null default 'draft',

  subtotal numeric(14,2) not null default 0,

  tax_amount numeric(14,2) not null default 0,

  total_amount numeric(14,2) not null default 0,

  paid_amount numeric(14,2) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (business_id, invoice_number)
);


create index invoices_business_id_idx
  on public.invoices(business_id);

create index invoices_customer_id_idx
  on public.invoices(customer_id);


-- ============================================================
-- PAYMENTS
-- ============================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  invoice_id uuid
    references public.invoices(id)
    on delete set null,

  customer_id uuid
    references public.customers(id)
    on delete set null,

  payment_date date not null,

  amount numeric(14,2) not null,

  payment_method text,

  reference text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);


create index payments_business_id_idx
  on public.payments(business_id);

create index payments_invoice_id_idx
  on public.payments(invoice_id);


-- ============================================================
-- EXPENSES
-- ============================================================

create table public.expenses (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  category text not null,

  description text,

  amount numeric(14,2) not null,

  expense_date date not null,

  supplier_id uuid
    references public.suppliers(id)
    on delete set null,

  project_id uuid
    references public.projects(id)
    on delete set null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);


create index expenses_business_id_idx
  on public.expenses(business_id);

create index expenses_project_id_idx
  on public.expenses(project_id);


-- ============================================================
-- INVENTORY
-- ============================================================

create table public.inventory (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id)
    on delete cascade,

  quantity numeric(14,3) not null default 0,

  reorder_level numeric(14,3),

  unit_cost numeric(14,2),

  warehouse text,

  updated_at timestamptz not null default now(),

  unique (business_id, product_id, warehouse)
);


create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id)
    on delete cascade,

  supplier_id uuid
    references public.suppliers(id)
    on delete set null,

  transaction_type public.inventory_transaction_type not null,

  quantity numeric(14,3) not null,

  unit_cost numeric(14,2),

  reference text,

  transaction_date date not null,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);


create index inventory_business_id_idx
  on public.inventory(business_id);

create index inventory_product_id_idx
  on public.inventory(product_id);

create index inventory_transactions_business_id_idx
  on public.inventory_transactions(business_id);

create index inventory_transactions_product_id_idx
  on public.inventory_transactions(product_id);


-- ============================================================
-- BUSINESS EVENTS
-- ============================================================

create table public.business_events (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  event_type text not null,

  title text not null,

  description text,

  severity text,

  occurred_at timestamptz not null default now(),

  entity_type text,

  entity_id uuid,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);


create index business_events_business_id_idx
  on public.business_events(business_id);

create index business_events_occurred_at_idx
  on public.business_events(business_id, occurred_at desc);


-- ============================================================
-- RECOMMENDATIONS
-- ============================================================

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id)
    on delete cascade,

  title text not null,

  reason text,

  evidence jsonb not null default '{}'::jsonb,

  impact jsonb not null default '{}'::jsonb,

  confidence numeric(5,2),

  status public.recommendation_status not null default 'new',

  entity_type text,

  entity_id uuid,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


create index recommendations_business_id_idx
  on public.recommendations(business_id);

create index recommendations_status_idx
  on public.recommendations(business_id, status);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();


create trigger datasets_set_updated_at
before update on public.datasets
for each row execute function public.set_updated_at();


create trigger entities_set_updated_at
before update on public.entities
for each row execute function public.set_updated_at();


create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();


create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();


create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();


create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();


create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();


create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();


create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();


create trigger recommendations_set_updated_at
before update on public.recommendations
for each row execute function public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.businesses enable row level security;
alter table public.business_users enable row level security;
alter table public.datasets enable row level security;
alter table public.data_imports enable row level security;
alter table public.entities enable row level security;
alter table public.products enable row level security;
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;
alter table public.projects enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.business_events enable row level security;
alter table public.recommendations enable row level security;


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_users
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;


create or replace function public.is_business_admin(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.business_users
    where business_id = target_business_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;


-- ============================================================
-- RLS POLICIES
-- ============================================================

create policy "members can view businesses"
on public.businesses
for select
using (
  public.is_business_member(id)
);


create policy "authenticated users can create businesses"
on public.businesses
for insert
with check (
  auth.uid() is not null
);


create policy "admins can update businesses"
on public.businesses
for update
using (
  public.is_business_admin(id)
)
with check (
  public.is_business_admin(id)
);


create policy "members can view memberships"
on public.business_users
for select
using (
  user_id = auth.uid()
  or public.is_business_member(business_id)
);


create policy "admins can manage memberships"
on public.business_users
for all
using (
  public.is_business_admin(business_id)
)
with check (
  public.is_business_admin(business_id)
);


create policy "members can access datasets"
on public.datasets
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access imports"
on public.data_imports
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access entities"
on public.entities
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access products"
on public.products
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access suppliers"
on public.suppliers
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access customers"
on public.customers
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access projects"
on public.projects
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access orders"
on public.orders
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access order items"
on public.order_items
for all
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and public.is_business_member(orders.business_id)
  )
);


create policy "members can access invoices"
on public.invoices
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access payments"
on public.payments
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access expenses"
on public.expenses
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access inventory"
on public.inventory
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access inventory transactions"
on public.inventory_transactions
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access business events"
on public.business_events
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);


create policy "members can access recommendations"
on public.recommendations
for all
using (
  public.is_business_member(business_id)
)
with check (
  public.is_business_member(business_id)
);