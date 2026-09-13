-- Migration 0015: Add customer archival support

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Index for efficient querying of active customers
CREATE INDEX IF NOT EXISTS customers_business_id_is_active_idx 
ON public.customers(business_id, is_active);

-- Update RLS policy to respect is_active
DROP POLICY IF EXISTS "members can access customers" ON public.customers;
CREATE POLICY "members can access customers"
ON public.customers
FOR ALL
USING (
  public.is_business_member(business_id)
  AND is_active = true
)
WITH CHECK (
  public.is_business_member(business_id)
);
