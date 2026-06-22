-- 053: Add student coordinators to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS student_coordinators text[] DEFAULT '{}';
