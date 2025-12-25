-- Hardened Security Suite Migration (Consolidated Version)
-- Merged with Brother's SQL suggestions & Complete Schema Alignment
-- ensures all tables: books, profiles, pages, orders, cart, referrals, rewards are SOUND AND SECURE.

-- 1. DATABASE SCHEMA UPDATES (Safety Checks)
DO $$ 
BEGIN 
    -- Books metadata alignment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='error_message') THEN ALTER TABLE public.books ADD COLUMN error_message TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='subtitle') THEN ALTER TABLE public.books ADD COLUMN subtitle TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='author_name') THEN ALTER TABLE public.books ADD COLUMN author_name TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='isbn') THEN ALTER TABLE public.books ADD COLUMN isbn TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='description') THEN ALTER TABLE public.books ADD COLUMN description TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='keywords') THEN ALTER TABLE public.books ADD COLUMN keywords TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='copyright_year') THEN ALTER TABLE public.books ADD COLUMN copyright_year TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='character_reference_url') THEN ALTER TABLE public.books ADD COLUMN character_reference_url TEXT; END IF;

    -- 2. DROP DEPENDENT POLICIES BEFORE COLUMN DROPS
    DROP POLICY IF EXISTS "Users can update own non-sensitive profile data" ON public.profiles;

    -- 3. REMOVE CREDITS COLUMN (Transparency Phase)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='credits') THEN 
        ALTER TABLE public.profiles DROP COLUMN credits; 
    END IF;
END $$;

-- 2. Security Definer Functions (Refined for non-credit logic)
-- deduct_user_credit and refund_user_credit are now DEPRECATED.
DROP FUNCTION IF EXISTS public.deduct_user_credit(UUID);
DROP FUNCTION IF EXISTS public.refund_user_credit(UUID);

-- 3. Enhanced RLS Policies for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- DROP POLICY IF EXISTS "Users can update own non-sensitive profile data" ON public.profiles; (Already dropped above)
CREATE POLICY "Users can update own non-sensitive profile data" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Prevent manual modification of sensitive tracking via scoped subqueries
        (CASE WHEN (SELECT p.store_credit_balance FROM public.profiles p WHERE p.id = public.profiles.id) IS DISTINCT FROM store_credit_balance THEN false ELSE true END) AND
        (CASE WHEN (SELECT p.samples_used FROM public.profiles p WHERE p.id = public.profiles.id) IS DISTINCT FROM samples_used THEN false ELSE true END) AND
        (CASE WHEN (SELECT p.last_sample_at FROM public.profiles p WHERE p.id = public.profiles.id) IS DISTINCT FROM last_sample_at THEN false ELSE true END)
    );

-- 4. Enhanced RLS Policies for Books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own books" ON public.books;
DROP POLICY IF EXISTS "Users can view own books" ON public.books;
CREATE POLICY "Users can view own books" ON public.books
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own books" ON public.books;
CREATE POLICY "Users can insert own books" ON public.books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own books metadata" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
CREATE POLICY "Users can update own books" ON public.books
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        -- Scoped subqueries to prevent "more than one row" bug
        (CASE WHEN (SELECT b.is_purchased FROM public.books b WHERE b.id = public.books.id) IS DISTINCT FROM is_purchased THEN false ELSE true END) AND
        (CASE WHEN (SELECT b.status FROM public.books b WHERE b.id = public.books.id) IS DISTINCT FROM status THEN false ELSE true END)
    );

DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
CREATE POLICY "Users can delete own books" ON public.books
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Enhanced RLS Policies for Pages (Access via Book Ownership)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage pages of own books" ON public.pages;
CREATE POLICY "Users can manage pages of own books" ON public.pages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE public.books.id = public.pages.book_id 
    AND public.books.user_id = auth.uid()
  )
);

-- 6. RLS for Orders & Cart (New Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
CREATE POLICY "Users can manage own cart" ON public.cart FOR ALL USING (auth.uid() = user_id);

-- 7. RLS for Referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own rewards" ON public.referral_rewards;
CREATE POLICY "Users can view own rewards" ON public.referral_rewards FOR SELECT USING (auth.uid() = user_id);

-- 8. Storage Buckets (Ensures buckets exist for the policies)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('story-images', 'story-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('colored-masterpieces', 'colored-masterpieces', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- 9. High-Security Storage Logic (Prevents RLS violations)
-- Enforces userId/bookId folder structure
DROP POLICY IF EXISTS "User Folder Access" ON storage.objects;
CREATE POLICY "User Folder Access" ON storage.objects 
    FOR ALL
    TO authenticated
    USING ((storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects 
    FOR SELECT USING (bucket_id IN ('story-images', 'colored-masterpieces'));
