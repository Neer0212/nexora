-- Migration: 0008_operational_platform.sql
-- Adds: purchases system, expense enhancements, notifications, stock alert trigger
-- Fixes: multi-item attribution bugs, initial stock transaction logging

-- ============================================================
-- 1. PURCHASES / STOCK-IN SYSTEM
-- ============================================================

-- Purchase order status enum
DO $$ BEGIN
  CREATE TYPE public.purchase_status AS ENUM ('draft', 'ordered', 'partial', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Purchase orders header table
CREATE TABLE IF NOT EXISTS public.purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id   uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_number text NOT NULL,
  status        purchase_status NOT NULL DEFAULT 'draft',
  order_date    date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  received_date date,
  subtotal      numeric(14,2) NOT NULL DEFAULT 0,
  tax_amount    numeric(14,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(14,2) NOT NULL DEFAULT 0,
  total_amount  numeric(14,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid',
  notes         text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, purchase_number)
);

CREATE TRIGGER purchases_set_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Purchase line items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id     uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id      uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_ordered numeric(14,3) NOT NULL DEFAULT 0,
  quantity_received numeric(14,3) NOT NULL DEFAULT 0,
  unit_cost       numeric(14,2) NOT NULL DEFAULT 0,
  tax             numeric(14,2) NOT NULL DEFAULT 0,
  total_amount    numeric(14,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS for purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can access purchases" ON public.purchases
  FOR ALL USING (is_business_member(business_id))
  WITH CHECK (is_business_member(business_id));

-- RLS for purchase_items (through purchases)
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members can access purchase items" ON public.purchase_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND is_business_member(purchases.business_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.purchases
    WHERE purchases.id = purchase_items.purchase_id
    AND is_business_member(purchases.business_id)
  ));

-- ============================================================
-- 2. RECEIVE PURCHASE ORDER RPC (Atomic stock-in)
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_stock_in(
  p_business_id   uuid,
  p_purchase_id   uuid,
  p_items         jsonb  -- array of { product_id, quantity_received, unit_cost }
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item       jsonb;
  v_product_id uuid;
  v_qty        numeric;
  v_cost       numeric;
  v_purchase   record;
BEGIN
  -- Verify purchase exists and belongs to this business
  SELECT id, status INTO v_purchase
  FROM public.purchases
  WHERE id = p_purchase_id AND business_id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order not found';
  END IF;

  IF v_purchase.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot receive a cancelled purchase order';
  END IF;

  -- Process each received item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_qty        := (v_item ->> 'quantity_received')::numeric;
    v_cost       := (v_item ->> 'unit_cost')::numeric;

    IF v_qty <= 0 THEN
      CONTINUE;
    END IF;

    -- Update purchase_items received quantity
    UPDATE public.purchase_items
    SET quantity_received = quantity_received + v_qty
    WHERE purchase_id = p_purchase_id AND product_id = v_product_id;

    -- Increment product stock
    UPDATE public.products
    SET stock_quantity = COALESCE(stock_quantity, 0) + v_qty,
        unit_cost = v_cost  -- update latest cost
    WHERE id = v_product_id AND business_id = p_business_id;

    -- Log inventory transaction
    INSERT INTO public.inventory_transactions (
      business_id, product_id, supplier_id, transaction_type,
      quantity, unit_cost, reference, transaction_date
    )
    SELECT
      p_business_id,
      v_product_id,
      purchases.supplier_id,
      'purchase',
      v_qty,
      v_cost,
      'PO-' || purchases.purchase_number,
      CURRENT_DATE
    FROM public.purchases WHERE id = p_purchase_id;
  END LOOP;

  -- Check if all items are fully received
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_items
    WHERE purchase_id = p_purchase_id
    AND quantity_received < quantity_ordered
  ) THEN
    UPDATE public.purchases
    SET status = 'received', received_date = CURRENT_DATE
    WHERE id = p_purchase_id;
  ELSE
    UPDATE public.purchases
    SET status = 'partial'
    WHERE id = p_purchase_id AND status != 'partial';
  END IF;
END;
$$;

-- ============================================================
-- 3. EXPENSE TABLE ENHANCEMENTS
-- ============================================================

-- Add missing columns to expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS tax_amount numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reference_number text;

-- Add updated_at trigger for expenses
DO $$ BEGIN
  CREATE TRIGGER expenses_set_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text NOT NULL DEFAULT 'info',  -- 'low_stock', 'revenue_drop', 'return_spike', 'goal_miss', 'info'
  title       text NOT NULL,
  message     text,
  severity    text NOT NULL DEFAULT 'info',  -- 'info', 'warning', 'critical'
  is_read     boolean NOT NULL DEFAULT false,
  read_at     timestamptz,
  action_url  text,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can access own notifications" ON public.notifications
  FOR ALL
  USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND is_business_member(business_id))
  )
  WITH CHECK (is_business_member(business_id));

-- Index for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, is_read, created_at DESC);

-- ============================================================
-- 5. STOCK ALERT FUNCTION
-- (Called after checkout to generate low-stock notifications)
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_low_stock_alerts(
  p_business_id uuid,
  p_product_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_product record;
BEGIN
  FOR v_product IN
    SELECT id, name, stock_quantity, low_stock_threshold
    FROM public.products
    WHERE id = ANY(p_product_ids)
      AND business_id = p_business_id
      AND stock_quantity IS NOT NULL
      AND low_stock_threshold IS NOT NULL
      AND stock_quantity <= low_stock_threshold
      AND stock_quantity > 0
  LOOP
    -- Only create if no unread notification exists for this product
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE business_id = p_business_id
        AND entity_type = 'product'
        AND entity_id = v_product.id
        AND type = 'low_stock'
        AND is_read = false
    ) THEN
      INSERT INTO public.notifications (
        business_id, type, title, message, severity,
        action_url, entity_type, entity_id
      ) VALUES (
        p_business_id,
        'low_stock',
        'Low Stock: ' || v_product.name,
        v_product.name || ' has only ' || v_product.stock_quantity || ' units remaining (threshold: ' || v_product.low_stock_threshold || ')',
        CASE
          WHEN v_product.stock_quantity <= 0 THEN 'critical'
          WHEN v_product.stock_quantity <= v_product.low_stock_threshold * 0.5 THEN 'warning'
          ELSE 'info'
        END,
        '/pos/inventory',
        'product',
        v_product.id
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_purchases_business ON public.purchases (business_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_date ON public.expenses (business_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_business_date ON public.orders (business_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_business ON public.inventory_transactions (business_id, transaction_date DESC);
