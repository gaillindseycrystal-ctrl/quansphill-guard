-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- transactions: signed-in staff only
DROP POLICY IF EXISTS "Anyone can read simulated transactions" ON public.transactions;
CREATE POLICY "Signed-in staff can read transactions"
ON public.transactions FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- reviews: signed-in staff only
DROP POLICY IF EXISTS "Anyone can read review outcomes" ON public.reviews;
CREATE POLICY "Signed-in staff can read reviews"
ON public.reviews FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- settings: readable by signed-in staff, changeable by admins only
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Staff can change settings" ON public.settings;
CREATE POLICY "Signed-in staff can read settings"
ON public.settings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can change settings"
ON public.settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.transactions FROM anon;
REVOKE SELECT ON public.reviews FROM anon;
REVOKE SELECT ON public.settings FROM anon;
