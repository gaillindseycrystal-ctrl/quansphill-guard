GRANT INSERT, DELETE ON public.user_roles TO authenticated;

DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can grant admin role" ON public.user_roles;
CREATE POLICY "Admins can grant admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  role = 'admin'::public.app_role
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can revoke admin role" ON public.user_roles;
CREATE POLICY "Admins can revoke admin role"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  role = 'admin'::public.app_role
  AND public.has_role(auth.uid(), 'admin')
);

CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'admin'::public.app_role THEN
    PERFORM pg_advisory_xact_lock(hashtext('public.user_roles.admin-removal'));
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin'::public.app_role) <= 1 THEN
      RAISE EXCEPTION 'The last administrator cannot be removed.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_last_admin_removal() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_last_admin_removal ON public.user_roles;
CREATE TRIGGER prevent_last_admin_removal
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_admin_removal();