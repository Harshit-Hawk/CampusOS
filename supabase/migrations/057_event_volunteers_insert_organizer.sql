-- Allow event organizers and admins to insert event_volunteers records
CREATE POLICY "Organizers can insert event volunteers"
ON "public"."event_volunteers"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_id
    AND (events.organizer_id = auth.uid() OR has_role('admin'))
  )
);
