-- NUCLEAR OPTION: Drop ALL triggers and functions related to profile creation
-- This ensures we start with a completely clean slate

DO $$ 
BEGIN
    -- Drop ALL triggers on auth.users
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
    DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users CASCADE;
    DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
    
    -- Drop ALL triggers on public.profiles
    DROP TRIGGER IF EXISTS on_profile_created ON public.profiles CASCADE;
    DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles CASCADE;
    DROP TRIGGER IF EXISTS ensure_credits_integrity ON public.profiles CASCADE;
    
    -- Drop ALL functions that might reference credits
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS public.handle_new_user_profile() CASCADE;
    DROP FUNCTION IF EXISTS public.deduct_user_credit(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.refund_user_credit(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.check_credits() CASCADE;
    DROP FUNCTION IF EXISTS public.set_default_credits() CASCADE;
END $$;

-- Recreate the CLEAN trigger function (no credits!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, updated_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email, 
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.profiles TO postgres;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Backfill existing users
INSERT INTO public.profiles (id, email, updated_at)
SELECT 
    au.id, 
    au.email, 
    now()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, 
    updated_at = now();
