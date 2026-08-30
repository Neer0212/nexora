-- ============================================================
-- NEXORA V1
-- Migration 0002: Secure Business Creation
-- ============================================================

create or replace function public.create_business(
  p_name text,
  p_business_type text default null,
  p_industry text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_business_id uuid;
  v_slug text;
begin
  -- Get authenticated user
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Validate business name
  if p_name is null or trim(p_name) = '' then
    raise exception 'Business name is required';
  end if;

  -- Generate a unique slug
  v_slug :=
    regexp_replace(
      lower(trim(p_name)),
      '[^a-z0-9]+',
      '-',
      'g'
    );

  v_slug :=
    trim(both '-' from v_slug)
    || '-'
    || substr(gen_random_uuid()::text, 1, 8);

  -- Create business
  insert into public.businesses (
    name,
    slug,
    business_type,
    industry
  )
  values (
    trim(p_name),
    v_slug,
    nullif(trim(p_business_type), ''),
    nullif(trim(p_industry), '')
  )
  returning id into v_business_id;

  -- Create owner membership
  insert into public.business_users (
    business_id,
    user_id,
    role
  )
  values (
    v_business_id,
    v_user_id,
    'owner'
  );

  return v_business_id;
end;
$$;


-- Only authenticated users should be able to call this function.
revoke execute on function public.create_business(text, text, text)
from public;

grant execute on function public.create_business(text, text, text)
to authenticated;