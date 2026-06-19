-- Migration 042: Gamification Expansion
-- New rank system, expanded XP sources, leaderboard views

-- 1. Add rank tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank_tier TEXT DEFAULT 'bronze'
    CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'));

-- 2. Portfolio-related fields on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_projects JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_portfolio_public BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_slug TEXT UNIQUE;

-- 3. Function to calculate rank tier from XP
CREATE OR REPLACE FUNCTION public.calculate_rank_tier(xp INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF xp >= 75000 THEN RETURN 'legend';
    ELSIF xp >= 35000 THEN RETURN 'diamond';
    ELSIF xp >= 15000 THEN RETURN 'platinum';
    ELSIF xp >= 5000 THEN RETURN 'gold';
    ELSIF xp >= 1000 THEN RETURN 'silver';
    ELSE RETURN 'bronze';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Update increment_xp to also update rank_tier
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
  new_xp integer;
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

  -- Update user XP, level, and rank
  UPDATE public.profiles
  SET xp_points = xp_points + xp_amount,
      level = public.calculate_level(xp_points + xp_amount),
      rank_tier = public.calculate_rank_tier(xp_points + xp_amount),
      updated_at = now()
  WHERE id = target_user_id
  RETURNING xp_points INTO new_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update existing users rank tiers
UPDATE public.profiles SET rank_tier = public.calculate_rank_tier(xp_points);

-- 6. Generate portfolio slugs for existing users
UPDATE public.profiles
SET portfolio_slug = LOWER(REPLACE(COALESCE(full_name, 'user'), ' ', '-')) || '-' || substr(id::text, 1, 4)
WHERE portfolio_slug IS NULL;

-- 7. Leaderboard Views (department, club, volunteer, overall)
CREATE OR REPLACE VIEW public.leaderboard_department AS
SELECT
    p.id, p.full_name, p.avatar_url, p.department, p.xp_points, p.level, p.rank_tier, p.roll_no,
    ROW_NUMBER() OVER (PARTITION BY p.department ORDER BY p.xp_points DESC) as dept_rank
FROM public.profiles p
WHERE p.role NOT IN ('admin', 'faculty') AND p.department IS NOT NULL;

CREATE OR REPLACE VIEW public.leaderboard_volunteers AS
SELECT
    p.id, p.full_name, p.avatar_url, p.department,
    vs.total_hours, vs.total_events, vs.avg_rating, vs.leadership_score,
    ROW_NUMBER() OVER (ORDER BY vs.total_hours DESC) as vol_rank
FROM public.profiles p
JOIN public.volunteer_stats vs ON p.id = vs.user_id;

-- 8. Additional XP triggers for new activities

-- Award XP on club join
CREATE OR REPLACE FUNCTION public.award_xp_on_club_join()
RETURNS trigger AS $$
BEGIN
    PERFORM public.increment_xp(NEW.user_id, 15, 'Joined a club', 'club', NEW.club_id);
    PERFORM public.increment_cc(NEW.user_id, 5, 'Club membership reward');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_club_join_award_xp ON public.club_members;
CREATE TRIGGER on_club_join_award_xp
    AFTER INSERT ON public.club_members
    FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_club_join();

-- Award XP on event registration
CREATE OR REPLACE FUNCTION public.award_xp_on_event_register()
RETURNS trigger AS $$
BEGIN
    PERFORM public.increment_xp(NEW.user_id, 5, 'Registered for event', 'event_register', NEW.event_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_register_award_xp ON public.event_registrations;
CREATE TRIGGER on_event_register_award_xp
    AFTER INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_event_register();
