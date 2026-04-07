
-- Admin staff management functions
CREATE OR REPLACE FUNCTION public.admin_update_staff(
  _target_user_id uuid,
  _full_name text DEFAULT NULL,
  _branch_id uuid DEFAULT NULL,
  _status text DEFAULT NULL,
  _role app_role DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller_biz uuid;
  _target_biz uuid;
BEGIN
  SELECT business_id INTO _caller_biz FROM profiles WHERE id = auth.uid();
  SELECT business_id INTO _target_biz FROM profiles WHERE id = _target_user_id;
  
  IF _caller_biz IS NULL OR _caller_biz != _target_biz THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  UPDATE profiles SET
    full_name = COALESCE(_full_name, full_name),
    branch_id = COALESCE(_branch_id, branch_id),
    status = COALESCE(_status, status),
    updated_at = now()
  WHERE id = _target_user_id;

  IF _role IS NOT NULL THEN
    UPDATE user_roles SET role = _role WHERE user_id = _target_user_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_staff(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller_biz uuid;
  _target_biz uuid;
BEGIN
  SELECT business_id INTO _caller_biz FROM profiles WHERE id = auth.uid();
  SELECT business_id INTO _target_biz FROM profiles WHERE id = _target_user_id;

  IF _caller_biz IS NULL OR _caller_biz != _target_biz THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  UPDATE profiles SET status = 'inactive', business_id = NULL, branch_id = NULL, updated_at = now()
  WHERE id = _target_user_id;

  DELETE FROM user_roles WHERE user_id = _target_user_id;
END;
$$;

-- Vendors table
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read vendors" ON public.vendors
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admin/manager manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()) AND is_admin_or_manager(auth.uid()));

-- Stock purchases table
CREATE TABLE public.stock_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  vendor_id uuid REFERENCES public.vendors(id),
  quantity integer NOT NULL,
  purchase_price numeric NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read stock purchases" ON public.stock_purchases
  FOR SELECT TO authenticated
  USING (business_id = get_user_business_id(auth.uid()));

CREATE POLICY "Admin/manager manage stock purchases" ON public.stock_purchases
  FOR ALL TO authenticated
  USING (business_id = get_user_business_id(auth.uid()) AND is_admin_or_manager(auth.uid()));
