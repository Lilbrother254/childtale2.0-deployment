-- 01_schema.sql: Consolidated Core Schema

-- Cleanup existing schema for a clean slate
DROP TABLE IF EXISTS public.cart CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Profiles: User account data and sample tracking
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    credits integer DEFAULT 3,
    samples_used integer DEFAULT 0,
    store_credit_balance numeric DEFAULT 0,
    is_admin boolean DEFAULT false, -- Added for security hardening triggers
    last_sample_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Books: Story metadata and distribution fields
CREATE TABLE public.books (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    category text NOT NULL,
    child_name text NOT NULL,
    child_age integer,
    child_gender text,
    character_description text,
    original_prompt text,
    page_count integer DEFAULT 5,
    status text DEFAULT 'generating', -- generating, completed, failed, draft
    is_purchased boolean DEFAULT false,
    has_been_regenerated boolean DEFAULT false,
    is_public boolean DEFAULT false,
    character_reference_url text,
    
    -- Distribution Metadata (Lulu Compliance)
    subtitle text,
    author_name text,
    isbn text,
    description text,
    keywords text,
    copyright_year text,
    
    created_at timestamptz DEFAULT now()
);

-- 3. Pages: Story text and generated image references
CREATE TABLE public.pages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    page_number integer NOT NULL,
    story_text text,
    image_prompt text,
    generated_image_url text,
    colored_image_url text, -- For digital coloring saves
    created_at timestamptz DEFAULT now()
);

-- 4. Orders: Transactions and Print-on-Demand tracking
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id uuid REFERENCES public.books(id) ON DELETE SET NULL,
    order_type text NOT NULL, -- digital, hardcover
    product_name text,
    base_price numeric NOT NULL,
    final_amount numeric NOT NULL,
    currency text DEFAULT 'USD',
    payment_status text DEFAULT 'pending', -- pending, succeeded, failed
    payment_provider text DEFAULT 'paypal',
    provider_order_id text,
    
    -- Fulfillment & Automation Info
    fulfillment_status text DEFAULT 'pending', -- pending, pending_lulu, sent_to_printer, shipped
    fulfillment_provider_id text, -- Lulu Job ID
    tracking_number text,
    shipping_status text DEFAULT 'pending', -- Internal: pending, printed, shipped, delivered, failed
    error_log text,
    last_retry_at timestamptz,
    
    shipping_name text,
    shipping_address jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now() -- Added for status tracking
);

-- 5. Coupons: Promo code management
CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    discount_percent integer NOT NULL,
    max_uses integer DEFAULT 100,
    current_uses integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 6. Referrals: Growth tracking
CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Renamed for parity
    referred_email text UNIQUE NOT NULL,
    status text DEFAULT 'pending', -- pending, joined, successful, purchased
    discount_earned integer DEFAULT 10,
    redeemed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    redeemed_at timestamptz
);

-- 7. Cart: Checkout state
CREATE TABLE public.cart (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
    price numeric NOT NULL,
    item_type text DEFAULT 'DIGITAL',
    added_at timestamptz DEFAULT now()
);

-- Comments
COMMENT ON COLUMN public.orders.shipping_status IS 'Internal fulfillment status: pending, printed, shipped, delivered, failed';
