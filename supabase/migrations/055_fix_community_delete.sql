-- Migration 055: Fix community delete policy
-- Adds missing RLS policy to allow owners to delete their communities

CREATE POLICY "Owners can delete communities"
    ON public.communities FOR DELETE USING (
        auth.uid() = owner_id OR public.has_role('admin')
    );
