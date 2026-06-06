-- 012_student_batches.sql

CREATE TABLE public.student_batches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
    roll_no_pattern text NOT NULL,
    current_semester integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ensure a student cannot be enrolled in the same subject twice
ALTER TABLE public.student_subjects
ADD CONSTRAINT unique_student_subject UNIQUE (student_id, subject_id);
