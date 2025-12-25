-- Fix missing insert policy for profiles
-- This migration adds the INSERT policy for the profiles table which was missing after previous hardening.

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
