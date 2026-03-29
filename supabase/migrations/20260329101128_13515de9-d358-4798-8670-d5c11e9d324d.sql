
-- Fix permissive business insert policy
DROP POLICY IF EXISTS "Allow insert business" ON public.businesses;
CREATE POLICY "Authenticated can insert business" ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND business_id IS NOT NULL)
  );
