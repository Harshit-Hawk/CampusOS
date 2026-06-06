-- ============================================
-- CampusOS Database Schema
-- Complete migration with tables, functions,
-- triggers, indexes, and RLS policies.
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if the current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(role_name text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = role_name
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer AS $$
DECLARE
  thresholds integer[] := ARRAY[0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000, 13000, 16500, 20500, 25000];
  i integer;
BEGIN
  FOR i IN REVERSE array_length(thresholds, 1)..1 LOOP
    IF xp >= thresholds[i] THEN
      RETURN i;
    END IF;
  END LOOP;
  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Increment XP for a user
CREATE OR REPLACE FUNCTION public.increment_xp(
  target_user_id uuid,
  xp_amount integer,
  xp_reason text,
  xp_source_type text,
  xp_source_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  new_xp integer;
  new_level integer;
BEGIN
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


-- ============================================
-- TABLES
-- ============================================

-- Profiles table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  banner_url text,
  department text,
  year integer CHECK (year >= 1 AND year <= 6),
  bio text,
  skills text[] DEFAULT '{}',
  xp_points integer DEFAULT 0,
  level integer DEFAULT 1,
  role text DEFAULT 'student' CHECK (role IN ('student', 'club_leader', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE public.posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  media_urls text[] DEFAULT '{}',
  category text DEFAULT 'general' CHECK (category IN ('general', 'academic', 'social', 'events', 'announcements', 'achievements')),
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Post likes table
CREATE TABLE public.post_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE public.post_comments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Clubs table
CREATE TABLE public.clubs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  logo_url text,
  banner_url text,
  category text DEFAULT 'Other',
  leader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Club members table
CREATE TABLE public.club_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'leader')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- Events table
CREATE TABLE public.events (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  banner_url text,
  location text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  max_attendees integer,
  registered_count integer DEFAULT 0,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Event registrations table
CREATE TABLE public.event_registrations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Badges table
CREATE TABLE public.badges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  xp_reward integer DEFAULT 0,
  criteria text NOT NULL UNIQUE
);

-- User badges table
CREATE TABLE public.user_badges (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- XP transactions table
CREATE TABLE public.xp_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  created_at timestamptz DEFAULT now()
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX idx_club_members_club ON public.club_members(club_id);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_events_start ON public.events(start_date);
CREATE INDEX idx_events_club ON public.events(club_id);
CREATE INDEX idx_event_registrations_event ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON public.event_registrations(user_id);
CREATE INDEX idx_xp_transactions_user ON public.xp_transactions(user_id);
CREATE INDEX idx_profiles_xp ON public.profiles(xp_points DESC);
CREATE INDEX idx_profiles_department ON public.profiles(department);
CREATE INDEX idx_profiles_username ON public.profiles(username);


-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || substr(gen_random_uuid()::text, 1, 4)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update like count trigger
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

-- Update comment count trigger
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_post_comment_change
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- Update club member count trigger
CREATE OR REPLACE FUNCTION public.update_club_member_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clubs SET member_count = member_count - 1 WHERE id = OLD.club_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_club_member_change
  AFTER INSERT OR DELETE ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION public.update_club_member_count();

-- Update event registered count trigger
CREATE OR REPLACE FUNCTION public.update_event_registered_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET registered_count = registered_count + 1 WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET registered_count = registered_count - 1 WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_event_registration_change
  AFTER INSERT OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_event_registered_count();


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.has_role('admin'));

-- POSTS policies
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING ((SELECT auth.uid()) = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING ((SELECT auth.uid()) = author_id);
CREATE POLICY "Admins can delete any post" ON public.posts FOR DELETE USING (public.has_role('admin'));

-- POST LIKES policies
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated can like" ON public.post_likes FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can unlike own" ON public.post_likes FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- POST COMMENTS policies
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment" ON public.post_comments FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can delete any comment" ON public.post_comments FOR DELETE USING (public.has_role('admin'));

-- CLUBS policies
CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Admins can create clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'));
CREATE POLICY "Leaders can update own club" ON public.clubs FOR UPDATE USING ((SELECT auth.uid()) = leader_id);
CREATE POLICY "Admins can update any club" ON public.clubs FOR UPDATE USING (public.has_role('admin'));
CREATE POLICY "Admins can delete clubs" ON public.clubs FOR DELETE USING (public.has_role('admin'));

-- CLUB MEMBERS policies
CREATE POLICY "Anyone can view club members" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Authenticated can join clubs" ON public.club_members FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can remove members" ON public.club_members FOR DELETE USING (public.has_role('admin'));

-- EVENTS policies
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Leaders and admins can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (
  (SELECT auth.uid()) = organizer_id AND (public.has_role('admin') OR public.has_role('club_leader'))
);
CREATE POLICY "Organizers can update own events" ON public.events FOR UPDATE USING ((SELECT auth.uid()) = organizer_id);
CREATE POLICY "Admins can update any event" ON public.events FOR UPDATE USING (public.has_role('admin'));
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE USING (public.has_role('admin'));
CREATE POLICY "Organizers can delete own events" ON public.events FOR DELETE USING ((SELECT auth.uid()) = organizer_id);

-- EVENT REGISTRATIONS policies
CREATE POLICY "Anyone can view registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Authenticated can register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can unregister" ON public.event_registrations FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- BADGES policies
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (public.has_role('admin'));

-- USER BADGES policies
CREATE POLICY "Anyone can view user badges" ON public.user_badges FOR SELECT USING (true);

-- XP TRANSACTIONS policies
CREATE POLICY "Users can view own XP" ON public.xp_transactions FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Admins can view all XP" ON public.xp_transactions FOR SELECT USING (public.has_role('admin'));


-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('clubs', 'clubs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Authenticated users can upload post images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');
CREATE POLICY "Users can delete own post images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "Club images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'clubs');
CREATE POLICY "Authenticated users can upload club images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clubs');

CREATE POLICY "Event images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Authenticated users can upload event images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'events');


-- ============================================
-- SEED DEFAULT BADGES
-- ============================================

INSERT INTO public.badges (name, description, icon_url, xp_reward, criteria) VALUES
  ('First Steps', 'Create your first post', '🚀', 50, 'first_post'),
  ('Social Butterfly', 'Join 3 clubs', '🦋', 75, 'join_3_clubs'),
  ('Event Explorer', 'Attend 5 events', '🎪', 100, 'attend_5_events'),
  ('Rising Star', 'Reach Level 5', '⭐', 100, 'reach_level_5'),
  ('Influencer', 'Get 50 likes on posts', '💫', 150, 'receive_50_likes'),
  ('Commentator', 'Write 20 comments', '💬', 75, 'write_20_comments'),
  ('Club Champion', 'Lead a club', '🏆', 200, 'lead_club'),
  ('Campus Legend', 'Reach Level 10', '👑', 500, 'reach_level_10'),
  ('Event Master', 'Organize 3 events', '🎯', 150, 'organize_3_events'),
  ('Profile Pro', 'Complete your profile', '✨', 40, 'complete_profile');
