-- Add promo_code column to orders table to track promo usage
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='promo_code') THEN 
        ALTER TABLE public.orders ADD COLUMN promo_code TEXT; 
    END IF;
END $$;
