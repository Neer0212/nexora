-- Migration 0013: Order Idempotency and Security

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE;

CREATE OR REPLACE FUNCTION public.process_pos_checkout(
  p_business_id   uuid,
  p_customer_id   uuid,
  p_order_number  text,
  p_subtotal      numeric,
  p_discount      numeric,
  p_tax           numeric,
  p_total         numeric,
  p_payment_method text,
  p_items         jsonb,
  p_idempotency_key uuid DEFAULT NULL
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

  -- Idempotency check: if an order with this key already exists for this business, return it
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_order_id FROM public.orders 
    WHERE business_id = p_business_id AND idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
      RETURN v_order_id;
    END IF;
  END IF;

  -- Guard: check stock availability for all tracked products BEFORE inserting anything
  -- Use FOR UPDATE to lock the product rows and prevent concurrent transactions from overselling
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty        := (v_item->>'quantity')::numeric;
    v_product_name := v_item->>'name';

    IF v_product_id IS NOT NULL THEN
      SELECT stock_quantity INTO v_stock
      FROM public.products
      WHERE id = v_product_id AND business_id = p_business_id
      FOR UPDATE; -- Locks the row until the transaction completes

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
    payment_method, payment_status, idempotency_key
  ) VALUES (
    p_business_id, p_customer_id, p_order_number, 'confirmed', CURRENT_DATE,
    p_subtotal, p_discount, p_tax, p_total,
    p_payment_method, 'paid', p_idempotency_key
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
