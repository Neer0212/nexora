-- Migration 0012: Purchase stock-in fixes

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
  v_product    record;
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

  IF v_purchase.status = 'received' THEN
    RAISE EXCEPTION 'Purchase order is already fully received';
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

    IF v_cost < 0 THEN
      RAISE EXCEPTION 'Unit cost cannot be negative';
    END IF;

    -- Validate product belongs to current workspace
    SELECT id INTO v_product
    FROM public.products
    WHERE id = v_product_id AND business_id = p_business_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % not found in this workspace', v_product_id;
    END IF;

    -- Update purchase_items received quantity
    UPDATE public.purchase_items
    SET quantity_received = COALESCE(quantity_received, 0) + v_qty
    WHERE purchase_id = p_purchase_id AND product_id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is not part of this purchase order', v_product_id;
    END IF;

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
    AND COALESCE(quantity_received, 0) < quantity_ordered
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
