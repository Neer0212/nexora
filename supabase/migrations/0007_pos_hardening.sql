-- =============================================================================
-- 0007_pos_hardening.sql
-- POS Hardening: oversell guard, returns RPC, atomic manual stock adjustment
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Replace process_pos_checkout with an oversell-safe version
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_pos_checkout(
  p_business_id   uuid,
  p_customer_id   uuid,
  p_order_number  text,
  p_subtotal      numeric,
  p_discount      numeric,
  p_tax           numeric,
  p_total         numeric,
  p_payment_method text,
  p_items         jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id   uuid;
  v_item       jsonb;
  v_product_id uuid;
  v_qty        numeric;
  v_stock      numeric;
  v_product_name text;
BEGIN
  -- Guard: business must exist
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'Business not found: %', p_business_id;
  END IF;

  -- Guard: check stock availability for all tracked products BEFORE inserting anything
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::numeric;
    v_product_name := v_item->>'name';

    IF v_product_id IS NOT NULL THEN
      SELECT stock_quantity INTO v_stock
      FROM public.products
      WHERE id = v_product_id AND business_id = p_business_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', v_product_id;
      END IF;

      IF v_stock IS NOT NULL AND v_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for "%": available %, requested %',
          v_product_name, v_stock, v_qty;
      END IF;
    END IF;
  END LOOP;

  -- Create Order
  INSERT INTO public.orders (
    business_id, customer_id, order_number, status, order_date,
    subtotal, discount, tax_amount, total_amount,
    payment_method, payment_status
  ) VALUES (
    p_business_id, p_customer_id, p_order_number, 'confirmed', CURRENT_DATE,
    p_subtotal, p_discount, p_tax, p_total,
    p_payment_method, 'paid'
  )
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::numeric;

    -- Insert order item (price snapshot)
    INSERT INTO public.order_items (
      order_id, product_id,
      product_name_snapshot, sku_snapshot, barcode_snapshot,
      quantity, unit_price, cost_price, discount, tax, total_amount
    ) VALUES (
      v_order_id, v_product_id,
      v_item->>'name',
      v_item->>'sku',
      v_item->>'barcode',
      v_qty,
      (v_item->>'price')::numeric,
      (v_item->>'cost')::numeric,
      (v_item->>'discount')::numeric,
      (v_item->>'tax')::numeric,
      (v_item->>'total')::numeric
    );

    -- Deduct inventory and log transaction
    IF v_product_id IS NOT NULL THEN
      INSERT INTO public.inventory_transactions (
        business_id, product_id, transaction_type,
        quantity, unit_cost, reference, transaction_date
      ) VALUES (
        p_business_id, v_product_id, 'sale',
        -v_qty,
        (v_item->>'cost')::numeric,
        p_order_number,
        CURRENT_DATE
      );

      UPDATE public.products
      SET stock_quantity = COALESCE(stock_quantity, 0) - v_qty
      WHERE id = v_product_id AND business_id = p_business_id;
    END IF;
  END LOOP;

  -- Record payment
  INSERT INTO public.payments (
    business_id, order_id, customer_id,
    payment_date, amount, payment_method, reference
  ) VALUES (
    p_business_id, v_order_id, p_customer_id,
    CURRENT_DATE, p_total, p_payment_method, p_order_number
  );

  RETURN v_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Returns RPC — atomically reverses an order
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_pos_return(
  p_business_id   uuid,
  p_original_order_id uuid,
  p_reason        text DEFAULT 'Customer return'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_return_order_id uuid;
  v_original_order  public.orders;
  v_item            public.order_items;
  v_return_number   text;
BEGIN
  -- Fetch original order
  SELECT * INTO v_original_order
  FROM public.orders
  WHERE id = p_original_order_id AND business_id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_original_order.status = 'returned' THEN
    RAISE EXCEPTION 'Order has already been returned';
  END IF;

  -- Generate return order number
  v_return_number := 'RET-' || SUBSTRING(v_original_order.order_number FROM 5);

  -- Create return order
  INSERT INTO public.orders (
    business_id, customer_id, order_number, status, order_date,
    subtotal, discount, tax_amount, total_amount,
    payment_method, payment_status
  ) VALUES (
    p_business_id, v_original_order.customer_id, v_return_number, 'returned', CURRENT_DATE,
    -v_original_order.subtotal, 0, -v_original_order.tax_amount, -v_original_order.total_amount,
    v_original_order.payment_method, 'refunded'
  )
  RETURNING id INTO v_return_order_id;

  -- Mirror each item as a negative and re-credit stock
  FOR v_item IN
    SELECT * FROM public.order_items WHERE order_id = p_original_order_id
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id,
      product_name_snapshot, sku_snapshot, barcode_snapshot,
      quantity, unit_price, cost_price, discount, tax, total_amount
    ) VALUES (
      v_return_order_id, v_item.product_id,
      v_item.product_name_snapshot, v_item.sku_snapshot, v_item.barcode_snapshot,
      -v_item.quantity, v_item.unit_price, v_item.cost_price, v_item.discount, v_item.tax, -v_item.total_amount
    );

    -- Re-credit inventory
    IF v_item.product_id IS NOT NULL THEN
      INSERT INTO public.inventory_transactions (
        business_id, product_id, transaction_type,
        quantity, unit_cost, reference, transaction_date
      ) VALUES (
        p_business_id, v_item.product_id, 'return',
        v_item.quantity,
        v_item.cost_price,
        v_return_number,
        CURRENT_DATE
      );

      UPDATE public.products
      SET stock_quantity = COALESCE(stock_quantity, 0) + v_item.quantity
      WHERE id = v_item.product_id AND business_id = p_business_id;
    END IF;
  END LOOP;

  -- Mark original order as returned
  UPDATE public.orders SET status = 'returned' WHERE id = p_original_order_id;

  RETURN v_return_order_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Atomic manual stock adjustment (avoids SELECT+UPDATE race condition)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.atomic_stock_adjustment(
  p_business_id    uuid,
  p_product_id     uuid,
  p_delta          numeric,   -- positive = add, negative = remove
  p_type           inventory_transaction_type,
  p_unit_cost      numeric DEFAULT NULL,
  p_supplier_id    uuid DEFAULT NULL,
  p_reference      text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_stock numeric;
BEGIN
  -- Guard: product must belong to business
  IF NOT EXISTS (
    SELECT 1 FROM public.products
    WHERE id = p_product_id AND business_id = p_business_id
  ) THEN
    RAISE EXCEPTION 'Product not found for this business';
  END IF;

  -- Insert transaction log
  INSERT INTO public.inventory_transactions (
    business_id, product_id, supplier_id, transaction_type,
    quantity, unit_cost, reference, transaction_date
  ) VALUES (
    p_business_id, p_product_id, p_supplier_id, p_type,
    p_delta, p_unit_cost, p_reference, CURRENT_DATE
  );

  -- Atomic stock update, return new stock level
  UPDATE public.products
  SET stock_quantity = COALESCE(stock_quantity, 0) + p_delta
  WHERE id = p_product_id AND business_id = p_business_id
  RETURNING stock_quantity INTO v_new_stock;

  RETURN v_new_stock;
END;
$$;
