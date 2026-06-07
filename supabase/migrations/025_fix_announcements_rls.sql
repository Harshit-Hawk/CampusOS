-- Migration: Fix RLS for club_announcements inserts

DROP POLICY IF EXISTS "Club leaders can insert announcements" ON public.club_announcements;

CREATE POLICY "Club leaders and admins can insert announcements"
    ON public.club_announcements FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_announcements.club_id
            AND user_id = auth.uid()
            AND role IN ('leader', 'president', 'vice_president', 'secretary')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE id = public.club_announcements.club_id
            AND leader_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
