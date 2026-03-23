
-- 1. Attach the existing handle_new_user function as a trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Allow managers to view all user roles (needed for user directory)
CREATE POLICY "Managers can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'::app_role));

-- 3. Create an RPC to ensure a default role exists for the current user
CREATE OR REPLACE FUNCTION public.ensure_default_role()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Only insert if user has zero roles
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;
