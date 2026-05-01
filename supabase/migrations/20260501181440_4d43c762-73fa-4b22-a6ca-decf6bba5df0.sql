
CREATE TABLE public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL,
  branch_id uuid NOT NULL,
  order_id uuid,
  order_number text,
  customer_name text NOT NULL DEFAULT 'Walk-in Customer',
  courier text NOT NULL DEFAULT '',
  tracking_number text,
  status text NOT NULL DEFAULT 'pending',
  estimated_delivery date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (
    business_id = public.get_user_business_id(auth.uid())
    AND (public.is_admin_or_manager(auth.uid()) OR branch_id = public.get_user_branch_id(auth.uid()))
  );

CREATE POLICY "Admin/manager manage shipments" ON public.shipments
  FOR ALL TO authenticated
  USING (business_id = public.get_user_business_id(auth.uid()) AND public.is_admin_or_manager(auth.uid()))
  WITH CHECK (business_id = public.get_user_business_id(auth.uid()) AND public.is_admin_or_manager(auth.uid()));

CREATE INDEX idx_shipments_business ON public.shipments(business_id);
CREATE INDEX idx_shipments_order ON public.shipments(order_id);
