-- Migration: Allow club leaders and admins to add members to clubs

DROP POLICY IF EXISTS "Leaders and Admins can add members" ON public.club_members;

CREATE POLICY "Leaders and Admins can add members"
ON public.club_members FOR INSERT TO authenticated
WITH CHECK (
    public.has_role('admin') 
    OR 
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('leader', 'president', 'vice_president', 'moderator')
    )
);
