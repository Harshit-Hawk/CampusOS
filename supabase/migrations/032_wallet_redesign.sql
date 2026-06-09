-- Migration: Wallet Redesign & Reward Store

-- 1. Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL CHECK (cost > 0),
    image_url TEXT,
    stock INTEGER DEFAULT -1, -- -1 means infinite
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create reward_redemptions table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_id UUID REFERENCES public.rewards(id) ON DELETE RESTRICT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
    cost_at_redemption INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. RLS for new tables
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Rewards Policies
CREATE POLICY "Anyone can view active rewards"
    ON public.rewards FOR SELECT
    USING (is_active = true OR public.has_role('admin'));

CREATE POLICY "Admins can manage rewards"
    ON public.rewards FOR ALL
    USING (public.has_role('admin'));

-- Redemptions Policies
CREATE POLICY "Users view own redemptions"
    ON public.reward_redemptions FOR SELECT
    USING (user_id = auth.uid() OR public.has_role('admin'));

CREATE POLICY "Users can insert own redemptions"
    ON public.reward_redemptions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update redemptions"
    ON public.reward_redemptions FOR UPDATE
    USING (public.has_role('admin'));

-- 4. Update existing wallets and coin_transactions RLS to allow Admins to manage them
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet and admins view all" 
    ON public.wallets FOR SELECT 
    USING ((SELECT auth.uid()) = user_id OR public.has_role('admin'));

CREATE POLICY "Admins can update wallets"
    ON public.wallets FOR UPDATE
    USING (public.has_role('admin'));

DROP POLICY IF EXISTS "Users view own coin tx" ON public.coin_transactions;
CREATE POLICY "Users view own coin tx and admins view all" 
    ON public.coin_transactions FOR SELECT 
    USING ((SELECT auth.uid()) = user_id OR public.has_role('admin'));

CREATE POLICY "Admins can insert coin tx"
    ON public.coin_transactions FOR INSERT
    WITH CHECK (public.has_role('admin') OR (SELECT auth.uid()) = user_id);

-- 5. Modify increment_xp to ignore staff
CREATE OR REPLACE FUNCTION public.increment_xp(
  target_user_id uuid,
  xp_amount integer,
  xp_reason text,
  xp_source_type text,
  xp_source_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  target_role text;
BEGIN
  -- Check user role
  SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;
  
  -- Abort if Admin or Faculty
  IF target_role IN ('admin', 'faculty') THEN
    RETURN;
  END IF;

  -- Insert XP transaction
  INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, source_id)
  VALUES (target_user_id, xp_amount, xp_reason, xp_source_type, xp_source_id);

  -- Update user XP and level
  UPDATE public.profiles
  SET xp_points = xp_points + xp_amount,
      level = public.calculate_level(xp_points + xp_amount),
      updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create increment_cc
CREATE OR REPLACE FUNCTION public.increment_cc(
  target_user_id uuid,
  cc_amount integer,
  cc_reason text
)
RETURNS void AS $$
DECLARE
  target_role text;
BEGIN
  -- Check user role
  SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;
  
  -- Abort if Admin or Faculty
  IF target_role IN ('admin', 'faculty') THEN
    RETURN;
  END IF;

  -- Ensure wallet exists
  INSERT INTO public.wallets (user_id, balance) VALUES (target_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert Coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, reason)
  VALUES (target_user_id, cc_amount, cc_reason);

  -- Update Wallet Balance
  UPDATE public.wallets
  SET balance = balance + cc_amount,
      updated_at = now()
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
