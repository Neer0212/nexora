-- =============================================================================
-- 0010_product_sku_constraint.sql
-- Enforce SKU uniqueness per business
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_business_id_sku_key') THEN
        -- Add the unique constraint. In PostgreSQL, this automatically ignores rows where sku IS NULL.
        -- If we want to be explicit, a unique index with a WHERE clause is sometimes preferred, 
        -- but a standard constraint is simpler and works since NULL != NULL in Postgres.
        ALTER TABLE public.products ADD CONSTRAINT products_business_id_sku_key UNIQUE (business_id, sku);
    END IF;
END
$$;
