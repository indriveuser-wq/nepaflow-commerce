
CREATE OR REPLACE FUNCTION public.check_invitation(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_invitations
    WHERE email = lower(trim(_email))
      AND status = 'pending'
      AND expires_at > now()
  )
$$;
