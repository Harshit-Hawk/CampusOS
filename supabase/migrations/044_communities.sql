-- Migration 044: Discord-like Communities Feature
-- Adds tables for communities, channels, messages, and memberships

-- 1. Communities
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Community Members
CREATE TABLE IF NOT EXISTS public.community_members (
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (community_id, user_id)
);

-- 3. Community Channels
CREATE TABLE IF NOT EXISTS public.community_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    channel_type TEXT DEFAULT 'text' CHECK (channel_type IN ('text', 'announcement', 'voice')),
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Community Messages
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES public.community_channels(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_community_members_user ON public.community_members(user_id);
CREATE INDEX idx_community_channels_community ON public.community_channels(community_id);
CREATE INDEX idx_community_messages_channel ON public.community_messages(channel_id);
CREATE INDEX idx_community_messages_created ON public.community_messages(created_at DESC);

-- RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Communities Policies
CREATE POLICY "Anyone can view public communities"
    ON public.communities FOR SELECT USING (is_private = false OR EXISTS (
        SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid()
    ) OR public.has_role('admin'));

CREATE POLICY "Authenticated users can create communities"
    ON public.communities FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and Admins can update communities"
    ON public.communities FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.community_members 
            WHERE community_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        ) OR public.has_role('admin')
    );

-- Members Policies
CREATE POLICY "Members can view other members"
    ON public.community_members FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm2 
            WHERE cm2.community_id = community_id AND cm2.user_id = auth.uid()
        ) OR public.has_role('admin') OR EXISTS (
            SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.is_private = false
        )
    );

CREATE POLICY "Users can join public communities"
    ON public.community_members FOR INSERT WITH CHECK (
        user_id = auth.uid() AND (
            EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND is_private = false)
        )
    );

CREATE POLICY "Members can leave communities"
    ON public.community_members FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage members"
    ON public.community_members FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm2 
            WHERE cm2.community_id = community_id AND cm2.user_id = auth.uid() AND cm2.role IN ('owner', 'admin')
        ) OR public.has_role('admin')
    );

-- Channels Policies
CREATE POLICY "Members can view channels"
    ON public.community_channels FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.community_members 
            WHERE community_id = public.community_channels.community_id AND user_id = auth.uid()
        ) OR public.has_role('admin') OR EXISTS (
            SELECT 1 FROM public.communities c WHERE c.id = public.community_channels.community_id AND c.is_private = false
        )
    );

CREATE POLICY "Admins can manage channels"
    ON public.community_channels FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.community_members 
            WHERE community_id = public.community_channels.community_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
        ) OR public.has_role('admin')
    );

-- Messages Policies
CREATE POLICY "Members can view messages"
    ON public.community_messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.community_members cm
            JOIN public.community_channels cc ON cc.community_id = cm.community_id
            WHERE cc.id = public.community_messages.channel_id AND cm.user_id = auth.uid()
        ) OR public.has_role('admin')
    );

CREATE POLICY "Members can insert messages"
    ON public.community_messages FOR INSERT WITH CHECK (
        user_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.community_members cm
            JOIN public.community_channels cc ON cc.community_id = cm.community_id
            WHERE cc.id = channel_id AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Authors can update own messages"
    ON public.community_messages FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authors and moderators can delete messages"
    ON public.community_messages FOR DELETE USING (
        user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.community_members cm
            JOIN public.community_channels cc ON cc.community_id = cm.community_id
            WHERE cc.id = public.community_messages.channel_id AND cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin', 'moderator')
        ) OR public.has_role('admin')
    );

-- Triggers to handle auto-joining owner
CREATE OR REPLACE FUNCTION public.handle_new_community() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.community_members (community_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    
    -- Auto create a general channel
    INSERT INTO public.community_channels (community_id, name, description)
    VALUES (NEW.id, 'general', 'General discussion channel');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_created
    AFTER INSERT ON public.communities
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_community();

-- Add publication for realtime messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
