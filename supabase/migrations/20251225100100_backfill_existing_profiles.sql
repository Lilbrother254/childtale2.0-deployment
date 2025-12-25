-- Fix for existing users without profiles
-- This creates profiles for any auth.users that don't have a corresponding profile

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
