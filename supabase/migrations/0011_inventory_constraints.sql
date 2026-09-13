-- Migration 0011: Inventory Constraints

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'products_stock_quantity_check'
    ) THEN
        ALTER TABLE public.products 
        ADD CONSTRAINT products_stock_quantity_check 
        CHECK (stock_quantity IS NULL OR stock_quantity >= 0);
    END IF;
END
$$;
