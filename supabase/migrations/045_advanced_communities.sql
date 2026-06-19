-- Migration 045: Advanced Communities Extensions
-- Adds threads, reactions, polls, read receipts, and auto-join triggers

-- 1. Community Types
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS linked_entity_id UUID;

-- 2. Message Threads
ALTER TABLE public.community_messages
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE;

-- 3. Role Constraint Expansion (Add 'faculty')
ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_role_check;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_role_check 
CHECK (role IN ('owner', 'admin', 'moderator', 'member', 'faculty'));

-- 4. Message Reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(message_id, user_id, emoji)
);

-- 5. Read Receipts
CREATE TABLE IF NOT EXISTS public.channel_read_states (
    channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (channel_id, user_id)
);

-- 6. Polls
CREATE TABLE IF NOT EXISTS public.community_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE NOT NULL UNIQUE,
    question TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.community_poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.community_poll_votes (
    option_id UUID REFERENCES public.community_poll_options(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (option_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON public.community_poll_options(poll_id);

-- Storage Bucket for Community Files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community_files', 'community_files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view community files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'community_files');

CREATE POLICY "Authenticated users can upload community files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'community_files' AND auth.role() = 'authenticated');

-- RLS Enable
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_read_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

-- Basic Policies for new tables
CREATE POLICY "Members can view reactions"
    ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions"
    ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove reactions"
    ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own read states"
    ON public.channel_read_states FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view polls"
    ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll options"
    ON public.community_poll_options FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll votes"
    ON public.community_poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote"
    ON public.community_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote"
    ON public.community_poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Realtime updates for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_poll_votes;

-- Auto-Join Triggers

-- A. Auto-create Event Community
CREATE OR REPLACE FUNCTION public.handle_event_community()
RETURNS TRIGGER AS $$
DECLARE
    new_community_id UUID;
BEGIN
    -- Create the community
    INSERT INTO public.communities (name, description, owner_id, is_private, community_type, linked_entity_id)
    VALUES (NEW.title, 'Official community for ' || NEW.title, NEW.organizer_id, false, 'event', NEW.id)
    RETURNING id INTO new_community_id;
    
    -- Insert default channels
    INSERT INTO public.community_channels (community_id, name, description, position)
    VALUES 
        (new_community_id, 'announcements', 'Event updates', 0),
        (new_community_id, 'team-finding', 'Find teammates', 1),
        (new_community_id, 'queries', 'Ask questions', 2),
        (new_community_id, 'submissions', 'Submit projects', 3);
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_published
    AFTER INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_event_community();

-- B. Auto-join Event Community
CREATE OR REPLACE FUNCTION public.handle_event_registration_community()
RETURNS TRIGGER AS $$
DECLARE
    target_community_id UUID;
BEGIN
    -- Find the community linked to this event
    SELECT id INTO target_community_id FROM public.communities 
    WHERE community_type = 'event' AND linked_entity_id = NEW.event_id LIMIT 1;
    
    IF FOUND THEN
        -- Add member if not already in
        INSERT INTO public.community_members (community_id, user_id, role)
        VALUES (target_community_id, NEW.user_id, 'member')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_event_registration
    AFTER INSERT ON public.event_registrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_event_registration_community();

-- C. Auto-create Club Community
CREATE OR REPLACE FUNCTION public.handle_club_community()
RETURNS TRIGGER AS $$
DECLARE
    new_community_id UUID;
BEGIN
    INSERT INTO public.communities (name, description, owner_id, is_private, community_type, linked_entity_id)
    VALUES (NEW.name, 'Official community for ' || NEW.name, NEW.owner_id, false, 'club', NEW.id)
    RETURNING id INTO new_community_id;
    
    INSERT INTO public.community_channels (community_id, name, description, position)
    VALUES 
        (new_community_id, 'announcements', 'Club updates', 0),
        (new_community_id, 'general', 'General discussion', 1),
        (new_community_id, 'projects', 'Club projects', 2),
        (new_community_id, 'events', 'Club events', 3);
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_club_created
    AFTER INSERT ON public.clubs
    FOR EACH ROW EXECUTE FUNCTION public.handle_club_community();

-- D. Auto-join Club Community
CREATE OR REPLACE FUNCTION public.handle_club_member_community()
RETURNS TRIGGER AS $$
DECLARE
    target_community_id UUID;
BEGIN
    SELECT id INTO target_community_id FROM public.communities 
    WHERE community_type = 'club' AND linked_entity_id = NEW.club_id LIMIT 1;
    
    IF FOUND THEN
        INSERT INTO public.community_members (community_id, user_id, role)
        VALUES (target_community_id, NEW.user_id, 'member')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_club_joined
    AFTER INSERT ON public.club_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_club_member_community();
