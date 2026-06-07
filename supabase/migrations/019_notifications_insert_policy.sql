-- Add INSERT policy for notifications
CREATE POLICY "Auth users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
