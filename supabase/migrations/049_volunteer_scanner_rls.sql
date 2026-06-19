-- Allow scanner volunteers to check in attendees
CREATE POLICY "Scanner volunteers can insert attendees" ON public.event_attendees
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_volunteers
      WHERE event_id = event_attendees.event_id
      AND user_id = auth.uid()
      AND status = 'approved'
      AND can_scan = true
    )
  );

-- Allow scanner volunteers to manage daily attendance
CREATE POLICY "Scanner volunteers can manage daily attendance" ON public.event_daily_attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.event_volunteers
      WHERE event_id = event_daily_attendance.event_id
      AND user_id = auth.uid()
      AND status = 'approved'
      AND can_scan = true
    )
  );
