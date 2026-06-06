-- 002_upgrade_schema.sql

-- 1. NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'club_invite', 'club_application', 'event_reminder', 'announcement', 'certificate')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. CLUB APPLICATIONS
CREATE TABLE public.club_applications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- 3. EVENT VOLUNTEERS
CREATE TABLE public.event_volunteers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'general',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 4. EVENT CHECK-INS (ATTENDEES)
CREATE TABLE public.event_attendees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_time timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 5. SAVED POSTS
CREATE TABLE public.saved_posts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- 6. HASHTAGS
CREATE TABLE public.hashtags (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  post_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.post_hashtags (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id uuid REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(post_id, hashtag_id)
);

-- 7. CERTIFICATES
CREATE TABLE public.certificates (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  issuer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  issue_date timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- INDEXES
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_club_applications_club ON public.club_applications(club_id);
CREATE INDEX idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX idx_saved_posts_user ON public.saved_posts(user_id);
CREATE INDEX idx_certificates_user ON public.certificates(user_id);

-- TRIGGERS for Notifications
-- Auto notify on post like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger AS $$
BEGIN
  -- Don't notify if liking own post
  IF (SELECT author_id FROM public.posts WHERE id = NEW.post_id) != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
      'like',
      'New Like',
      (SELECT full_name FROM public.profiles WHERE id = NEW.user_id) || ' liked your post.',
      '/feed'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_notify
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- Auto notify on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger AS $$
BEGIN
  IF (SELECT author_id FROM public.posts WHERE id = NEW.post_id) != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      (SELECT author_id FROM public.posts WHERE id = NEW.post_id),
      'comment',
      'New Comment',
      (SELECT full_name FROM public.profiles WHERE id = NEW.user_id) || ' commented on your post.',
      '/feed'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- ROW LEVEL SECURITY
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Club Applications Policies
CREATE POLICY "Anyone views applications" ON public.club_applications FOR SELECT USING (true);
CREATE POLICY "Auth can apply" ON public.club_applications FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users manage own apps" ON public.club_applications FOR DELETE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Leaders update apps" ON public.club_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND leader_id = (SELECT auth.uid())) OR public.has_role('admin')
);

-- Event Volunteers Policies
CREATE POLICY "Anyone views volunteers" ON public.event_volunteers FOR SELECT USING (true);
CREATE POLICY "Auth can volunteer" ON public.event_volunteers FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Organizers manage volunteers" ON public.event_volunteers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = (SELECT auth.uid())) OR public.has_role('admin')
);

-- Event Attendees Policies
CREATE POLICY "Anyone views attendees" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Organizers can checkin" ON public.event_attendees FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = (SELECT auth.uid())) OR public.has_role('admin')
);

-- Saved Posts Policies
CREATE POLICY "Users view own saved" ON public.saved_posts FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can save" ON public.saved_posts FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can unsave" ON public.saved_posts FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Hashtags Policies
CREATE POLICY "Anyone views hashtags" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Anyone views post hashtags" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Auth can create hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update hashtags" ON public.hashtags FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can create post hashtags" ON public.post_hashtags FOR INSERT TO authenticated WITH CHECK (true);

-- Certificates Policies
CREATE POLICY "Anyone views certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Organizers issue certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = (SELECT auth.uid())) OR public.has_role('admin')
);
