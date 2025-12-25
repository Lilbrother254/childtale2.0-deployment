-- 02_rls.sql: Consolidated Row Level Security

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Books
CREATE POLICY "Users can manage own books" ON public.books
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view shared books" ON public.books
    FOR SELECT USING (is_public = true);

-- 3. Pages
CREATE POLICY "Users can manage own pages" ON public.pages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.books WHERE id = pages.book_id AND user_id = auth.uid())
    );
CREATE POLICY "Anyone can view shared pages" ON public.pages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.books WHERE id = pages.book_id AND is_public = true)
    );

-- 4. Orders
CREATE POLICY "Users can manage own orders" ON public.orders
    FOR ALL USING (auth.uid() = user_id);

-- 5. Cart
CREATE POLICY "Users can manage own cart" ON public.cart
    FOR ALL USING (auth.uid() = user_id);

-- 6. Coupons
CREATE POLICY "Anyone can read active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 7. Referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Referral system can insert" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id); -- Locked down to authenticated user
