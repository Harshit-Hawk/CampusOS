-- Migration 042: Certificate Storage Bucket

INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for certificates bucket
CREATE POLICY "Users can upload their own certificates" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'certificates' AND 
    auth.uid() = owner
);

CREATE POLICY "Users can update their own certificates" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'certificates' AND 
    auth.uid() = owner
);

CREATE POLICY "Anyone can view certificates" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'certificates'
);

CREATE POLICY "Users can delete their own certificates" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'certificates' AND 
    auth.uid() = owner
);
