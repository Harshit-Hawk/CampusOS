-- 003_gamification_engine.sql

-- 1. ADD REPUTATION TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation integer DEFAULT 0;

-- 2. XP TRANSACTIONS (already exists from 001)
-- Make sure policies are correct
DROP POLICY IF EXISTS "Users view own xp" ON public.xp_transactions;
DROP POLICY IF EXISTS "Admins can view all XP" ON public.xp_transactions;
CREATE POLICY "Users view own xp" ON public.xp_transactions FOR SELECT USING (true); -- Public for leaderboards

-- 3. WALLETS & CAMPUS COINS
CREATE TABLE public.wallets (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.coin_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL, -- positive for earn, negative for spend
  reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_coin_tx_user ON public.coin_transactions(user_id);

-- Auto-create wallet on profile insert
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Create wallets for existing users
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 4. USER STREAKS
CREATE TABLE public.user_streaks (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  streak_type text NOT NULL CHECK (streak_type IN ('daily_login', 'event_participation', 'club_activity')),
  current_count integer DEFAULT 0,
  longest_count integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, streak_type)
);

-- 5. BADGES (Table already exists, we will alter it)
ALTER TABLE public.badges 
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'hidden',
  ADD COLUMN IF NOT EXISTS is_seasonal boolean DEFAULT false;

-- user_badges already exists. We will just add policies if missing.

-- 6. ACHIEVEMENTS
CREATE TABLE public.achievements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  max_stages integer DEFAULT 1,
  xp_reward integer DEFAULT 0,
  coin_reward integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.user_achievements (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  current_stage integer DEFAULT 0,
  progress integer DEFAULT 0,
  completed_at timestamptz,
  PRIMARY KEY (user_id, achievement_id)
);

-- 7. TRIGGERS FOR XP AUTOMATION
-- Auto-award XP on Post Creation
CREATE OR REPLACE FUNCTION public.award_xp_on_post()
RETURNS trigger AS $$
BEGIN
  -- Insert into XP transactions (+10 XP for posting)
  INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, source_id) 
  VALUES (NEW.author_id, 10, 'Created a post', 'post', NEW.id);
  
  -- Update Profile XP
  UPDATE public.profiles SET xp_points = xp_points + 10 WHERE id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_award_xp
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_post();

-- Auto-award XP on Post Like
CREATE OR REPLACE FUNCTION public.award_xp_on_like()
RETURNS trigger AS $$
BEGIN
  -- Only award if not self-like
  IF (SELECT author_id FROM public.posts WHERE id = NEW.post_id) != NEW.user_id THEN
    -- Award +5 XP to the author of the post
    INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, source_id) 
    VALUES ((SELECT author_id FROM public.posts WHERE id = NEW.post_id), 5, 'Post was liked', 'like', NEW.id);
    
    UPDATE public.profiles SET xp_points = xp_points + 5 WHERE id = (SELECT author_id FROM public.posts WHERE id = NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_award_xp
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_like();

-- Auto-award XP and coins on Event Check-in
CREATE OR REPLACE FUNCTION public.award_xp_on_event_checkin()
RETURNS trigger AS $$
BEGIN
  -- Insert into XP transactions (+20 XP)
  INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, source_id) 
  VALUES (NEW.user_id, 20, 'Attended an event', 'event', NEW.event_id);
  
  UPDATE public.profiles SET xp_points = xp_points + 20 WHERE id = NEW.user_id;

  -- Insert into Coin transactions (+5 Coins)
  INSERT INTO public.coin_transactions (user_id, amount, reason) VALUES (NEW.user_id, 5, 'Event Attendance Reward');
  UPDATE public.wallets SET balance = balance + 5 WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_checkin_award
  AFTER INSERT ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_event_checkin();

-- 8. LEGACY XP MIGRATION
-- Create a transaction for existing users' XP so they show up on all-time leaderboards
-- (assuming they don't already have one)
INSERT INTO public.xp_transactions (user_id, amount, reason, source_type, created_at)
SELECT id, xp_points, 'Legacy XP Migration', 'migration', now() - interval '1 day'
FROM public.profiles
WHERE xp_points > 0
AND NOT EXISTS (
  SELECT 1 FROM public.xp_transactions WHERE user_id = public.profiles.id AND source_type = 'migration'
);

-- 9. ROW LEVEL SECURITY
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users view own coin tx" ON public.coin_transactions FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Anyone views streaks" ON public.user_streaks FOR SELECT USING (true);
CREATE POLICY "Anyone views achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Anyone views user achievements" ON public.user_achievements FOR SELECT USING (true);
