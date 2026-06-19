-- Add faculty coordinators and daily attendance requirement to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS faculty_coordinators text[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS require_daily_attendance BOOLEAN DEFAULT false;

-- Create daily attendance table
CREATE TABLE IF NOT EXISTS public.event_daily_attendance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  UNIQUE(event_id, user_id, date)
);

-- Add indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_event_daily_attendance_event_date ON public.event_daily_attendance(event_id, date);
CREATE INDEX IF NOT EXISTS idx_event_daily_attendance_user ON public.event_daily_attendance(user_id);

-- Enable RLS
ALTER TABLE public.event_daily_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for daily attendance
CREATE POLICY "Anyone can view daily attendance" ON public.event_daily_attendance FOR SELECT USING (true);

-- Event organizers and admins can insert/update
CREATE POLICY "Organizers and admins can manage daily attendance" ON public.event_daily_attendance FOR ALL USING (
  public.has_role('admin') OR
  (SELECT organizer_id FROM public.events WHERE id = event_daily_attendance.event_id) = (SELECT auth.uid())
);
