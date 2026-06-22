-- 054: Add coordinators to event_schedule
ALTER TABLE public.event_schedule ADD COLUMN IF NOT EXISTS faculty_coordinators text[] DEFAULT '{}';
ALTER TABLE public.event_schedule ADD COLUMN IF NOT EXISTS student_coordinators text[] DEFAULT '{}';
