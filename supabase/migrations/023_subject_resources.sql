-- 023_subject_resources.sql

-- 1. Create table for subject resources
CREATE TABLE IF NOT EXISTS public.subject_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'docx', 'link', 'video', 'other')),
    file_url TEXT,
    external_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.subject_resources ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Anyone (students, faculty) can view resources for their enrolled/assigned subjects
-- For simplicity, since academic details are usually open within the institution, we allow authenticated users to view all resources.
-- In a stricter system, you would join with student_subjects.
CREATE POLICY "Anyone can view subject resources" ON public.subject_resources FOR SELECT USING (true);

-- Faculty can manage their own uploaded resources
CREATE POLICY "Faculty can insert resources" ON public.subject_resources FOR INSERT WITH CHECK (
    auth.uid() = faculty_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
);

CREATE POLICY "Faculty can update their own resources" ON public.subject_resources FOR UPDATE USING (
    auth.uid() = faculty_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Faculty can delete their own resources" ON public.subject_resources FOR DELETE USING (
    auth.uid() = faculty_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Setup Storage Bucket for files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('academic-resources', 'academic-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for academic-resources bucket
CREATE POLICY "Anyone can view academic resources" 
ON storage.objects FOR SELECT USING (bucket_id = 'academic-resources');

CREATE POLICY "Faculty can upload academic resources" 
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'academic-resources' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
);

CREATE POLICY "Faculty can update their academic resources" 
ON storage.objects FOR UPDATE USING (
    bucket_id = 'academic-resources' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
);

CREATE POLICY "Faculty can delete their academic resources" 
ON storage.objects FOR DELETE USING (
    bucket_id = 'academic-resources' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'faculty'))
);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subject_resources;
