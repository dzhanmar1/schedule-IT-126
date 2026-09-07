-- Helpers to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_group_id()
RETURNS uuid AS $$
  SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Enable Admins to see and edit ALL groups
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;

CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Admins can manage groups" ON public.groups
  FOR ALL
  USING (public.get_user_role() = 'admin');

-- Enable Admins to see and edit ALL profiles
DROP POLICY IF EXISTS "Users can view profiles in their group" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view profiles in their group" ON public.profiles FOR SELECT USING (
  group_id = public.get_user_group_id()
);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Admin override policies
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE
  USING (public.get_user_role() = 'admin');
