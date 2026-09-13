-- Migration 0014: Harden Returns and Refunds Workflow

CREATE OR REPLACE FUNCTION public.process_pos_return(
  p_business_id        uuid,
  p_original_order_id  uuid,
  p_reason             text DEFAULT 'Customer return',
  p_idempotency_key    uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_return_order_id uuid;
  v_original_order  public.orders;
  v_item            public.order_items;
  v_return_number   text;
  v_items_count     integer := 0;
BEGIN
  -- Guard: business must exist
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RAISE EXCEPTION 'Business not found: %', p_business_id;
  END IF;

  -- Idempotency check: if a return order with this key already exists for this business, return it
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_return_order_id FROM public.orders
    WHERE business_id = p_business_id AND idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN v_return_order_id;
    END IF;
  END IF;

  -- Fetch original order with row lock to prevent concurrent return race conditions
  SELECT * INTO v_original_order
  FROM public.orders
  WHERE id = p_original_order_id AND business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_original_order.status = 'returned' THEN
    RAISE EXCEPTION 'Order has already been returned';
  END IF;

  IF v_original_order.status NOT IN ('confirmed', 'completed') THEN
    RAISE EXCEPTION 'Order is not eligible for return (status: %)', v_original_order.status;
  END IF;

  -- Verify the order has items to return
  SELECT count(*) INTO v_items_count
  FROM public.order_items
  WHERE order_id = p_original_order_id;

  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'Cannot return an order with no items';
  END IF;

  -- Generate return order number
  v_return_number := 'RET-' || SUBSTRING(v_original_order.order_number FROM 5);

  -- Create return order
  INSERT INTO public.orders (
    business_id, customer_id, order_number, status, order_date,
    subtotal, discount, tax_amount, total_amount,
    payment_method, payment_status, idempotency_key
  ) VALUES (
    p_business_id, v_original_order.customer_id, v_return_number, 'returned', CURRENT_DATE,
    -v_original_order.subtotal, 0, -v_original_order.tax_amount, -v_original_order.total_amount,
    v_original_order.payment_method, 'refunded', p_idempotency_key
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

    -- Re-credit inventory for tracked products
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

  -- Record negative payment / refund entry
  INSERT INTO public.payments (
    business_id, order_id, customer_id,
    payment_date, amount, payment_method, reference, metadata
  ) VALUES (
    p_business_id, v_return_order_id, v_original_order.customer_id,
    CURRENT_DATE, -v_original_order.total_amount, v_original_order.payment_method,
    v_return_number, jsonb_build_object('reason', p_reason, 'original_order_id', p_original_order_id)
  );

  -- Mark original order as returned
  UPDATE public.orders SET status = 'returned' WHERE id = p_original_order_id;

  RETURN v_return_order_id;
END;
$$;
