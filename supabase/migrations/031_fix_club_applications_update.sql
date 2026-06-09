-- Migration: Allow users to update their own club applications

CREATE POLICY "Users can update their own apps" 
ON public.club_applications FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());
