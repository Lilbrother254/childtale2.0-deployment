-- 04_seed.sql: Initial Launch Data

-- Initialize Heroes Launch Coupon (25% Off for first 100 orders)
INSERT INTO public.coupons (code, discount_percent, max_uses, current_uses)
VALUES ('HERO25', 25, 100, 0)
ON CONFLICT (code) DO NOTHING;

-- Initialize Welcome Discount (20% Off for new users)
INSERT INTO public.coupons (code, discount_percent, max_uses, current_uses)
VALUES ('WELCOME20', 20, 1000, 0)
ON CONFLICT (code) DO NOTHING;
