-- Migration 040: Event Communication Center
-- Broadcast messaging with targeting, delivery tracking

-- 1. Broadcast Announcements
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN (
        'event_reminder', 'venue_change', 'food_announcement', 'emergency',
        'deadline_update', 'mentor_announcement', 'general', 'custom'
    )),
    -- Targeting
    target_type TEXT NOT NULL CHECK (target_type IN (
        'all_students', 'department', 'event_participants', 'event_volunteers',
        'club_members', 'batch', 'custom'
    )),
    target_id UUID, -- event_id, club_id, etc. depending on target_type
    target_department TEXT,
    target_batch TEXT,
    -- Channels
    send_in_app BOOLEAN DEFAULT true,
    send_email BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT false,
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE, -- null = send immediately
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    -- Stats
    recipients_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Broadcast Receipts (track delivery per user)
CREATE TABLE IF NOT EXISTS public.broadcast_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID REFERENCES public.broadcast_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'push')),
    delivered BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(broadcast_id, user_id, channel)
);

-- Indexes
CREATE INDEX idx_broadcast_msgs_sender ON public.broadcast_messages(sender_id);
CREATE INDEX idx_broadcast_msgs_status ON public.broadcast_messages(status);
CREATE INDEX idx_broadcast_msgs_type ON public.broadcast_messages(message_type);
CREATE INDEX idx_broadcast_msgs_target ON public.broadcast_messages(target_type, target_id);
CREATE INDEX idx_broadcast_receipts_broadcast ON public.broadcast_receipts(broadcast_id);
CREATE INDEX idx_broadcast_receipts_user ON public.broadcast_receipts(user_id);

-- RLS
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_receipts ENABLE ROW LEVEL SECURITY;

-- Broadcast Messages Policies
CREATE POLICY "Recipients and senders can view broadcasts"
    ON public.broadcast_messages FOR SELECT USING (
        sender_id = auth.uid() OR public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.broadcast_receipts WHERE broadcast_id = id AND user_id = auth.uid())
    );
CREATE POLICY "Admins and organizers can create broadcasts"
    ON public.broadcast_messages FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND (
            public.has_role('admin') OR public.has_role('club_leader') OR public.has_role('faculty')
        )
    );
CREATE POLICY "Senders can update own broadcasts"
    ON public.broadcast_messages FOR UPDATE USING (
        sender_id = auth.uid() OR public.has_role('admin')
    );

-- Broadcast Receipts Policies
CREATE POLICY "Users can view own receipts"
    ON public.broadcast_receipts FOR SELECT USING (
        user_id = auth.uid() OR public.has_role('admin')
    );
CREATE POLICY "System can insert receipts"
    ON public.broadcast_receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark as read"
    ON public.broadcast_receipts FOR UPDATE USING (user_id = auth.uid());

-- Function: Send broadcast to recipients
CREATE OR REPLACE FUNCTION public.send_broadcast(broadcast_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    broadcast RECORD;
    recipient_count INTEGER := 0;
BEGIN
    SELECT * INTO broadcast FROM public.broadcast_messages WHERE id = broadcast_id_param;

    IF broadcast IS NULL THEN
        RAISE EXCEPTION 'Broadcast not found';
    END IF;

    -- Insert receipts based on target type
    IF broadcast.target_type = 'all_students' THEN
        INSERT INTO public.broadcast_receipts (broadcast_id, user_id, channel)
        SELECT broadcast_id_param, p.id, 'in_app'
        FROM public.profiles p
        WHERE p.role IN ('student', 'user', 'alumni')
        ON CONFLICT DO NOTHING;

    ELSIF broadcast.target_type = 'department' AND broadcast.target_department IS NOT NULL THEN
        INSERT INTO public.broadcast_receipts (broadcast_id, user_id, channel)
        SELECT broadcast_id_param, p.id, 'in_app'
        FROM public.profiles p
        WHERE p.department = broadcast.target_department
        ON CONFLICT DO NOTHING;

    ELSIF broadcast.target_type = 'event_participants' AND broadcast.target_id IS NOT NULL THEN
        INSERT INTO public.broadcast_receipts (broadcast_id, user_id, channel)
        SELECT broadcast_id_param, er.user_id, 'in_app'
        FROM public.event_registrations er
        WHERE er.event_id = broadcast.target_id
        ON CONFLICT DO NOTHING;

    ELSIF broadcast.target_type = 'event_volunteers' AND broadcast.target_id IS NOT NULL THEN
        INSERT INTO public.broadcast_receipts (broadcast_id, user_id, channel)
        SELECT broadcast_id_param, eva.volunteer_id, 'in_app'
        FROM public.event_volunteer_assignments eva
        WHERE eva.event_id = broadcast.target_id AND eva.status = 'approved'
        ON CONFLICT DO NOTHING;

    ELSIF broadcast.target_type = 'club_members' AND broadcast.target_id IS NOT NULL THEN
        INSERT INTO public.broadcast_receipts (broadcast_id, user_id, channel)
        SELECT broadcast_id_param, cm.user_id, 'in_app'
        FROM public.club_members cm
        WHERE cm.club_id = broadcast.target_id
        ON CONFLICT DO NOTHING;
    END IF;

    -- Also create in-app notifications for each recipient
    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT br.user_id, 'broadcast', broadcast.title, broadcast.content,
        jsonb_build_object('broadcast_id', broadcast_id_param, 'message_type', broadcast.message_type)
    FROM public.broadcast_receipts br
    WHERE br.broadcast_id = broadcast_id_param;

    -- Count recipients
    SELECT COUNT(*) INTO recipient_count
    FROM public.broadcast_receipts WHERE broadcast_id = broadcast_id_param;

    -- Update broadcast status
    UPDATE public.broadcast_messages
    SET status = 'sent', sent_at = now(), recipients_count = recipient_count
    WHERE id = broadcast_id_param;

    RETURN recipient_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
