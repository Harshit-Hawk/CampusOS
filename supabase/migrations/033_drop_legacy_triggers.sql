-- Migration: Drop Legacy Triggers
-- We are moving CC and XP logic to the backend to support role-based constraints and decoupled points

DROP TRIGGER IF EXISTS on_event_checkin_award ON public.event_attendees;
DROP FUNCTION IF EXISTS public.award_xp_on_event_checkin();

-- We also drop post and like triggers as they shouldn't award CC, and we want to enforce role checks.
-- Wait, the user said drop post creation completely from gamification! So let's drop them.
DROP TRIGGER IF EXISTS on_post_award_xp ON public.posts;
DROP FUNCTION IF EXISTS public.award_xp_on_post();

DROP TRIGGER IF EXISTS on_like_award_xp ON public.post_likes;
DROP FUNCTION IF EXISTS public.award_xp_on_like();
