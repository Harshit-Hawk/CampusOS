-- Fix send_broadcast function to use correct columns for notifications table
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
    -- Use 'message' and 'link' instead of 'body' and 'data', and 'announcement' as type
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT br.user_id, 'announcement', broadcast.title, broadcast.content,
        CASE 
            WHEN broadcast.target_type IN ('event_participants', 'event_volunteers') THEN '/events/' || broadcast.target_id
            WHEN broadcast.target_type = 'club_members' THEN '/clubs/' || broadcast.target_id
            ELSE '/feed'
        END
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
