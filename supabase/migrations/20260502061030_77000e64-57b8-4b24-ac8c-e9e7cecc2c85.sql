
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS slug text UNIQUE;

UPDATE public.businesses
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL;

ALTER TABLE public.businesses ALTER COLUMN slug SET NOT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'pos';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.get_public_shop(_slug text)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _biz RECORD; _branches json;
BEGIN
  SELECT id, name, phone, address INTO _biz FROM businesses WHERE slug = _slug;
  IF _biz IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(json_agg(json_build_object('id', id, 'name', name, 'address', address) ORDER BY is_main DESC, name), '[]'::json)
    INTO _branches FROM branches WHERE business_id = _biz.id;
  RETURN json_build_object('id', _biz.id, 'name', _biz.name, 'phone', _biz.phone, 'address', _biz.address, 'branches', _branches);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_public_shop(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_products(_slug text)
RETURNS TABLE(id uuid, name text, selling_price numeric, image_url text, category_id uuid, category_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.selling_price, p.image_url, p.category_id, c.name
  FROM products p LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.business_id = (SELECT id FROM businesses WHERE slug = _slug) AND p.status = 'active'
  ORDER BY p.name;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_products(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_public_order(
  _slug text, _branch_id uuid, _customer_name text, _customer_phone text, _items jsonb, _notes text DEFAULT NULL
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _biz_id uuid; _biz_name text; _prefix text; _count int; _order_number text; _order_id uuid;
  _subtotal numeric := 0; _item jsonb; _product RECORD; _qty int;
BEGIN
  IF _customer_phone !~ '^9[0-9]{9}$' THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  IF length(trim(_customer_name)) < 2 THEN RAISE EXCEPTION 'Invalid name'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;

  SELECT id, name INTO _biz_id, _biz_name FROM businesses WHERE slug = _slug;
  IF _biz_id IS NULL THEN RAISE EXCEPTION 'Shop not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM branches WHERE id = _branch_id AND business_id = _biz_id) THEN
    RAISE EXCEPTION 'Invalid branch';
  END IF;

  _prefix := upper(substring(regexp_replace(_biz_name, '[^a-zA-Z]', '', 'g') from 1 for 3));
  IF length(_prefix) < 1 THEN _prefix := 'ORD'; END IF;
  SELECT count(*) INTO _count FROM orders WHERE business_id = _biz_id;
  _order_number := _prefix || '-' || lpad((_count + 1)::text, 4, '0');

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty < 1 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    SELECT id, selling_price INTO _product FROM products
      WHERE id = (_item->>'product_id')::uuid AND business_id = _biz_id AND status = 'active';
    IF _product IS NULL THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    _subtotal := _subtotal + (_product.selling_price * _qty);
  END LOOP;

  INSERT INTO orders (order_number, business_id, branch_id, customer_name, customer_phone,
                      status, subtotal, discount, tax, total, payment_status, payment_method, notes, source)
  VALUES (_order_number, _biz_id, _branch_id, trim(_customer_name), _customer_phone,
          'received', _subtotal, 0, 0, _subtotal, 'pending', 'cash', _notes, 'online')
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    SELECT id, selling_price INTO _product FROM products WHERE id = (_item->>'product_id')::uuid;
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, total)
    VALUES (_order_id, _product.id, _qty, _product.selling_price, 0, _product.selling_price * _qty);
  END LOOP;

  RETURN json_build_object('order_id', _order_id, 'order_number', _order_number);
END; $$;
GRANT EXECUTE ON FUNCTION public.create_public_order(text, uuid, text, text, jsonb, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_order(_order_number text, _phone text)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _order RECORD; _items json; _branch_name text; _biz_name text;
BEGIN
  SELECT * INTO _order FROM orders
    WHERE order_number = _order_number AND customer_phone = _phone AND source = 'online';
  IF _order IS NULL THEN RETURN NULL; END IF;
  SELECT name INTO _branch_name FROM branches WHERE id = _order.branch_id;
  SELECT name INTO _biz_name FROM businesses WHERE id = _order.business_id;
  SELECT COALESCE(json_agg(json_build_object(
    'name', COALESCE(p.name, oi.custom_name, 'Item'),
    'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total', oi.total
  )), '[]'::json) INTO _items
  FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
  WHERE oi.order_id = _order.id;
  RETURN json_build_object(
    'order_number', _order.order_number, 'customer_name', _order.customer_name,
    'status', _order.status, 'total', _order.total,
    'created_at', _order.created_at, 'updated_at', _order.updated_at,
    'business_name', _biz_name, 'branch_name', _branch_name,
    'items', _items, 'notes', _order.notes
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.get_public_order(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.touch_orders_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_orders_updated_at();
