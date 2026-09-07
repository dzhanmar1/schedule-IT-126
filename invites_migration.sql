-- 1. Add new columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personal_invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id);

-- 2. Generate personal invite codes for existing users
UPDATE public.profiles
SET personal_invite_code = substring(uuid_generate_v4()::text from 1 for 8)
WHERE personal_invite_code IS NULL;

-- 3. Set DEFAULT value for future users
ALTER TABLE public.profiles
ALTER COLUMN personal_invite_code SET DEFAULT substring(uuid_generate_v4()::text from 1 for 8);

-- 4. Make it NOT NULL now that everyone has one
ALTER TABLE public.profiles
ALTER COLUMN personal_invite_code SET NOT NULL;

-- 5. Add RLS policy for reading all profiles by anyone IF they are trying to join
-- Currently, we need to find the user by their invite code without being logged in (or being logged in but without a group).
-- Let's create a special function to get group_id by personal_invite_code to avoid changing RLS on profiles.
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(code text)
RETURNS uuid AS $$
  SELECT group_id FROM public.profiles WHERE personal_invite_code = code LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_inviter_id_by_code(code text)
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE personal_invite_code = code LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;
