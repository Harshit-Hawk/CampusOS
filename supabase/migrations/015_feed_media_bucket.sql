-- Migration: Create feed_media storage bucket for post attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feed_media', 'feed_media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload feed media" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'feed_media' AND 
    auth.role() = 'authenticated'
);

-- Policy: Allow anyone to view feed media
CREATE POLICY "Public can view feed media" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'feed_media'
);

-- Policy: Allow users to delete their own media
CREATE POLICY "Users can delete own feed media" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'feed_media' AND 
    auth.uid() = owner
);
