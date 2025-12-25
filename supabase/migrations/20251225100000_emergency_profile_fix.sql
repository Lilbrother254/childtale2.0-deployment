-- Emergency Fix: Purge all credit-related legacy logic and fix profile creation
-- This migration ensures NO triggers or functions are referencing the dropped 'credits' column.

DO $$ 
BEGIN
    -- 1. DROP ALL POTENTIAL GHOST TRIGGERS
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
    DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles CASCADE;
    DROP TRIGGER IF EXISTS ensure_credits_integrity ON public.profiles CASCADE;
    
    -- 2. DROP DEPRECATED FUNCTIONS (with extra safety)
    DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    DROP FUNCTION IF EXISTS public.deduct_user_credit(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.refund_user_credit(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.check_credits() CASCADE;
END $$;

-- 3. RECREATE CLEAN PROFILE TRIGGER FUNCTION
-- This version NO LONGER references 'credits' or any removed columns.
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

-- Grant necessary permissions to the function
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.profiles TO postgres;

-- 4. RECREATE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ENSURE RLS FOR INSERT IS CORRECT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. DOUBLE CHECK COLUMN REMOVAL (Extra Safety)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='credits') THEN 
        ALTER TABLE public.profiles DROP COLUMN credits; 
    END IF;
END $$;
