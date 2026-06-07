-- 018_manual_batches.sql

-- Drop the roll_no_pattern column from student_batches
ALTER TABLE public.student_batches DROP COLUMN roll_no_pattern;

-- Add batch_id to profiles so students can be assigned to batches
ALTER TABLE public.profiles ADD COLUMN batch_id uuid REFERENCES public.student_batches(id) ON DELETE SET NULL;
