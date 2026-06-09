-- Migration: Create club-assets storage bucket

INSERT INTO storage.buckets (id, name, public)
VALUES ('club-assets', 'club-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to club-assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'club-assets');

-- Allow authenticated users to insert files into club-assets
CREATE POLICY "Authenticated users can upload club assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'club-assets');

-- Allow authenticated users to update their own files (optional, but good for completeness)
CREATE POLICY "Authenticated users can update club assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'club-assets');
