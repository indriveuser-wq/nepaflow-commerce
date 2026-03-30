
CREATE OR REPLACE FUNCTION public.setup_business(
  _business_name text,
  _business_address text,
  _business_phone text,
  _business_email text,
  _branch_name text,
  _user_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _biz_id uuid;
  _branch_id uuid;
  _existing_biz uuid;
BEGIN
  -- Check user isn't already associated with a business
  SELECT business_id INTO _existing_biz FROM profiles WHERE id = _user_id;
  IF _existing_biz IS NOT NULL THEN
    RAISE EXCEPTION 'User already has a business';
  END IF;

  -- Create business
  INSERT INTO businesses (name, address, phone, email)
  VALUES (_business_name, _business_address, _business_phone, _business_email)
  RETURNING id INTO _biz_id;

  -- Create main branch
  INSERT INTO branches (business_id, name, address, phone, is_main)
  VALUES (_biz_id, _branch_name, _business_address, _business_phone, true)
  RETURNING id INTO _branch_id;

  -- Update profile
  UPDATE profiles
  SET business_id = _biz_id, branch_id = _branch_id, full_name = _user_full_name
  WHERE id = _user_id;

  -- Assign admin role
  INSERT INTO user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('business_id', _biz_id, 'branch_id', _branch_id);
END;
$$;
