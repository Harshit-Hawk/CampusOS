-- Migration: Fix RLS for club_positions inserts, updates, and deletes

DROP POLICY IF EXISTS "Club leaders can manage positions" ON public.club_positions;

CREATE POLICY "Club leaders and admins can manage positions"
    ON public.club_positions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_positions.club_id
            AND user_id = auth.uid()
            AND role IN ('leader', 'president', 'vice_president', 'secretary')
        )
        OR 
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE id = public.club_positions.club_id
            AND leader_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );
