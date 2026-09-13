-- Migration 0016: Fix customer RLS policy to allow workspace members to select both active and archived customers
-- while maintaining workspace isolation and preventing physical deletion.

-- Drop the existing incorrect policy
DROP POLICY IF EXISTS "members can access customers" ON public.customers;

-- Policy for selecting customers: workspace members can select any customer in their business (active or archived)
CREATE POLICY "members can select customers"
ON public.customers
FOR SELECT
USING (
  public.is_business_member(business_id)
);

-- Policy for inserting and updating customers: workspace members can insert or update any customer in their business
CREATE POLICY "members can insert or update customers"
ON public.customers
FOR INSERT OR UPDATE
USING (
  public.is_business_member(business_id)
)
WITH CHECK (
  public.is_business_member(business_id)
);

-- Note: No policy is created for DELETE, so DELETE operations are disallowed by RLS.
-- This prevents physical deletion of customers, allowing only soft deletion via is_active flag.