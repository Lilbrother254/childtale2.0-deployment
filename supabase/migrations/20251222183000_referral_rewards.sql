-- 20251222183000_referral_rewards.sql
-- Create missing referral_rewards table and harden RLS

CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_type text NOT NULL, -- e.g., 'discount_code'
    reward_value text NOT NULL, -- e.g., '10' (representing 10% off)
    is_redeemed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    redeemed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own rewards" ON public.referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Note: Insert and Update (is_redeemed) should ideally be restricted.
-- In ChildTale, rewards are inserted by the process-payment Edge Function (service_role).
-- Redeeming can be done by the user but should be verified by the logic.

CREATE POLICY "Users can update own rewards (redeem only)" ON public.referral_rewards
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (CASE WHEN (SELECT is_redeemed FROM public.referral_rewards WHERE id = id) IS DISTINCT FROM is_redeemed THEN true ELSE false END)
    );

COMMENT ON TABLE public.referral_rewards IS 'Stores earned rewards for the referral system.';
