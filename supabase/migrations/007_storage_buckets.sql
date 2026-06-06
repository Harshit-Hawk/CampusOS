-- Phase 11: Storage Bucket for Assignments

INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for Submissions bucket
CREATE POLICY "Students can upload submissions" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'submissions' AND 
    auth.uid() = owner
);

CREATE POLICY "Students can update their submissions" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'submissions' AND 
    auth.uid() = owner
);

CREATE POLICY "Students can view their own submissions" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'submissions' AND 
    auth.uid() = owner
);

-- Note: In a real environment, faculty policies require joining with faculty_subjects
-- Here we'll allow anyone with role 'faculty' or 'admin' to read all submissions for simplicity.
CREATE POLICY "Faculty and Admins can view all submissions" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'submissions' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
);
