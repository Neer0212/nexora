-- Migration 0006: Nexora POS Schema Expansion

-- 1. Expand Products Table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold numeric(14,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_quantity numeric(14,3) DEFAULT 0;

-- Ensure barcode uniqueness per business
-- We first check if the constraint exists, but doing so directly in SQL requires a DO block
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_business_id_barcode_key') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_business_id_barcode_key UNIQUE (business_id, barcode);
    END IF;
END
$$;

-- 2. Expand Orders Table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount numeric(14,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

-- 3. Expand Order Items Table (Immutable Snapshots)
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_name_snapshot text,
ADD COLUMN IF NOT EXISTS sku_snapshot text,
ADD COLUMN IF NOT EXISTS barcode_snapshot text,
ADD COLUMN IF NOT EXISTS cost_price numeric(14,2),
ADD COLUMN IF NOT EXISTS discount numeric(14,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax numeric(14,2) NOT NULL DEFAULT 0;

-- 4. Expand Payments Table
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

-- 5. POS Transactional Checkout RPC
CREATE OR REPLACE FUNCTION public.process_pos_checkout(
  p_business_id UUID,
  p_customer_id UUID,
  p_order_number TEXT,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_items JSONB
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
BEGIN
  -- Validate business membership (RLS applies to tables, but checking inside SECURITY DEFINER is safer)
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'Invalid business_id';
  END IF;

  -- 1. Insert Order
  INSERT INTO public.orders (
    business_id, 
    order_number, 
    customer_id, 
    status, 
    order_date, 
    subtotal, 
    discount, 
    tax_amount, 
    total_amount, 
    payment_method, 
    payment_status
  ) VALUES (
    p_business_id, 
    p_order_number, 
    p_customer_id, 
    'confirmed', 
    CURRENT_DATE, 
    p_subtotal, 
    p_discount, 
    p_tax, 
    p_total, 
    p_payment_method, 
    'paid'
  ) RETURNING id INTO v_order_id;

  -- 2. Loop through items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert Order Item
    INSERT INTO public.order_items (
      order_id, 
      product_id, 
      product_name_snapshot, 
      sku_snapshot, 
      barcode_snapshot, 
      quantity, 
      unit_price, 
      cost_price, 
      discount, 
      tax, 
      total_amount
    ) VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id', '')::UUID,
      v_item->>'name',
      v_item->>'sku',
      v_item->>'barcode',
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'price')::NUMERIC,
      (v_item->>'cost')::NUMERIC,
      (v_item->>'discount')::NUMERIC,
      (v_item->>'tax')::NUMERIC,
      (v_item->>'total')::NUMERIC
    );

    -- Manage Inventory if product is tracked
    IF NULLIF(v_item->>'product_id', '') IS NOT NULL THEN
      -- Insert Movement
      INSERT INTO public.inventory_transactions (
        business_id, 
        product_id, 
        transaction_type, 
        quantity, 
        unit_cost, 
        transaction_date, 
        reference
      ) VALUES (
        p_business_id,
        (v_item->>'product_id')::UUID,
        'sale',
        -((v_item->>'quantity')::NUMERIC),
        (v_item->>'cost')::NUMERIC,
        CURRENT_DATE,
        p_order_number
      );
      
      -- Decrement Stock (Atomic)
      UPDATE public.products
      SET stock_quantity = COALESCE(stock_quantity, 0) - (v_item->>'quantity')::NUMERIC
      WHERE id = (v_item->>'product_id')::UUID AND business_id = p_business_id;
    END IF;
  END LOOP;

  -- 3. Insert Payment Record
  INSERT INTO public.payments (
    business_id, 
    order_id, 
    customer_id, 
    payment_date, 
    amount, 
    payment_method,
    reference
  ) VALUES (
    p_business_id, 
    v_order_id, 
    p_customer_id, 
    CURRENT_DATE, 
    p_total, 
    p_payment_method,
    p_order_number
  );

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
