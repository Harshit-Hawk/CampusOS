-- 051: Add scoped UPDATE policy for event_reports
-- The previous migration (050) correctly dropped the overly permissive "System can update reports" USING (true) policy,
-- but no replacement was added, which means report generation silently fails to update status to 'completed'.

CREATE POLICY "Report generators can update reports"
    ON public.event_reports FOR UPDATE USING (
        generated_by = auth.uid() OR
        public.has_role('admin') OR
        EXISTS (SELECT 1 FROM public.events WHERE id = event_id AND organizer_id = auth.uid())
    );
