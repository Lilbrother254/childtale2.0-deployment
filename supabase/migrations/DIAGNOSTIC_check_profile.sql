-- ABSOLUTE NUCLEAR OPTION: Temporarily disable RLS to diagnose the issue
-- Run this to see if RLS is blocking the profile fetch

-- 1. Check if profile exists
SELECT * FROM public.profiles WHERE id = 'e4afdc89-64ac-49bc-93cc-f4ee835cacc2';

-- 2. If the above returns nothing, manually insert it
INSERT INTO public.profiles (id, email, samples_used, store_credit_balance, is_admin, updated_at)
VALUES ('e4afdc89-64ac-49bc-93cc-f4ee835cacc2', 'childtale4@gmail.com', 0, 0, false, now())
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, 
    updated_at = now();

-- 3. Verify it was created
SELECT * FROM public.profiles WHERE id = 'e4afdc89-64ac-49bc-93cc-f4ee835cacc2';

-- 4. Check what RLS policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';
